import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ArchiveMetadata } from '../entities/archive-metadata.entity';
import { ArchiveJob } from '../entities/archive-job.entity';
import { ArchiveCriteria, ArchiveConfig } from '../interfaces/archive-config.interface';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);
  private readonly gzip = promisify(zlib.gzip);

  constructor(
    @InjectRepository(ArchiveMetadata)
    private archiveMetadataRepository: Repository<ArchiveMetadata>,
    @InjectRepository(ArchiveJob)
    private archiveJobRepository: Repository<ArchiveJob>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {}

  async archiveTable(tableName: string, criteria?: ArchiveCriteria): Promise<string> {
    const config = this.configService.get<ArchiveConfig>('archive');
    const tableCriteria = criteria || config.criteria.find(c => c.tableName === tableName);
    
    if (!tableCriteria || !tableCriteria.enabled) {
      throw new Error(`No archive criteria found for table: ${tableName}`);
    }

    // Create archive job record
    const job = this.archiveJobRepository.create({
      tableName,
      startTime: new Date(),
      status: 'running',
      criteria: tableCriteria,
    });
    await this.archiveJobRepository.save(job);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - tableCriteria.ageThreshold);

      // Get records to archive
      const recordsToArchive = await this.getRecordsToArchive(
        queryRunner,
        tableName,
        cutoffDate,
        tableCriteria,
      );

      this.logger.log(`Found ${recordsToArchive.length} records to archive from ${tableName}`);

      let archivedCount = 0;
      const batchSize = tableCriteria.batchSize || config.globalSettings.defaultBatchSize;

      // Process in batches
      for (let i = 0; i < recordsToArchive.length; i += batchSize) {
        const batch = recordsToArchive.slice(i, i + batchSize);
        archivedCount += await this.archiveBatch(queryRunner, tableName, batch);
        
        // Update job progress
        job.recordsProcessed = i + batch.length;
        job.recordsArchived = archivedCount;
        await this.archiveJobRepository.save(job);
      }

      await queryRunner.commitTransaction();

      // Update job completion
      job.endTime = new Date();
      job.status = 'completed';
      job.recordsProcessed = recordsToArchive.length;
      job.recordsArchived = archivedCount;
      await this.archiveJobRepository.save(job);

      this.logger.log(`Successfully archived ${archivedCount} records from ${tableName}`);
      return job.id;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      job.endTime = new Date();
      job.status = 'failed';
      job.errorMessage = error.message;
      await this.archiveJobRepository.save(job);
      
      this.logger.error(`Archive job failed for ${tableName}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async getRecordsToArchive(
    queryRunner: QueryRunner,
    tableName: string,
    cutoffDate: Date,
    criteria: ArchiveCriteria,
  ): Promise<any[]> {
    let query = `SELECT * FROM ${tableName} WHERE created_at < $1`;
    const params = [cutoffDate];

    if (criteria.customConditions) {
      query += ` AND ${criteria.customConditions}`;
    }

    if (criteria.sizeThreshold) {
      // Add size-based filtering if needed
      query += ` ORDER BY created_at ASC`;
    }

    return await queryRunner.query(query, params);
  }

  private async archiveBatch(
    queryRunner: QueryRunner,
    tableName: string,
    records: any[],
  ): Promise<number> {
    const archiveRecords = records.map(record => ({
      sourceTable: tableName,
      sourceId: record.id,
      archiveDate: new Date(),
      originalCreatedAt: record.created_at,
      originalData: record,
      status: 'archived' as const,
      archiveReason: 'automatic_aging',
      dataSize: JSON.stringify(record).length,
    }));

    // Save to archive metadata
    await queryRunner.manager.save(ArchiveMetadata, archiveRecords);

    // Delete from original table
    const ids = records.map(r => r.id);
    await queryRunner.query(
      `DELETE FROM ${tableName} WHERE id = ANY($1)`,
      [ids]
    );

    return records.length;
  }

  async retrieveArchivedData(
    tableName: string,
    filters: any = {},
    limit: number = 100,
  ): Promise<any[]> {
    const queryBuilder = this.archiveMetadataRepository
      .createQueryBuilder('archive')
      .where('archive.sourceTable = :tableName', { tableName })
      .andWhere('archive.status = :status', { status: 'archived' })
      .limit(limit)
      .orderBy('archive.archiveDate', 'DESC');

    // Add filters
    Object.keys(filters).forEach((key, index) => {
      queryBuilder.andWhere(`archive.originalData->>'${key}' = :filter${index}`, {
        [`filter${index}`]: filters[key],
      });
    });

    const archivedRecords = await queryBuilder.getMany();
    return archivedRecords.map(record => record.originalData);
  }

  async restoreArchivedData(archiveId: string): Promise<void> {
    const archiveRecord = await this.archiveMetadataRepository.findOne({
      where: { id: archiveId, status: 'archived' },
    });

    if (!archiveRecord) {
      throw new Error('Archive record not found or already restored');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Restore data to original table
      const { originalData } = archiveRecord;
      const tableName = archiveRecord.sourceTable;
      
      // Remove archive-specific fields
      delete originalData.id; // Let DB generate new ID
      
      await queryRunner.query(
        `INSERT INTO ${tableName} (${Object.keys(originalData).join(', ')}) 
         VALUES (${Object.keys(originalData).map((_, i) => `$${i + 1}`).join(', ')})`,
        Object.values(originalData)
      );

      // Update archive status
      archiveRecord.status = 'restored';
      await queryRunner.manager.save(archiveRecord);

      await queryRunner.commitTransaction();
      this.logger.log(`Successfully restored record ${archiveId} to ${tableName}`);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to restore record ${archiveId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async purgeOldArchives(): Promise<void> {
    const config = this.configService.get<ArchiveConfig>('archive');
    
    for (const criteria of config.criteria) {
      if (!criteria.enabled) continue;

      const purgeDate = new Date();
      purgeDate.setDate(purgeDate.getDate() - criteria.retentionPeriod);

      const recordsToPurge = await this.archiveMetadataRepository.find({
        where: {
          sourceTable: criteria.tableName,
          archiveDate: { $lt: purgeDate } as any,
          status: 'archived',
        },
      });

      if (recordsToPurge.length > 0) {
        // Update status to purged
        await this.archiveMetadataRepository.update(
          { id: { $in: recordsToPurge.map(r => r.id) } as any },
          { status: 'purged', updatedAt: new Date() }
        );

        this.logger.log(`Purged ${recordsToPurge.length} old archives from ${criteria.tableName}`);
      }
    }
  }

  async exportArchiveData(
    tableName: string,
    format: 'json' | 'csv' | 'sql' = 'json',
    startDate?: Date,
    endDate?: Date,
  ): Promise<string> {
    const queryBuilder = this.archiveMetadataRepository
      .createQueryBuilder('archive')
      .where('archive.sourceTable = :tableName', { tableName })
      .andWhere('archive.status = :status', { status: 'archived' });

    if (startDate) {
      queryBuilder.andWhere('archive.archiveDate >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('archive.archiveDate <= :endDate', { endDate });
    }

    const records = await queryBuilder.getMany();
    const data = records.map(r => r.originalData);

    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${tableName}_archive_${timestamp}.${format}`;
    const filePath = path.join(exportDir, filename);

    let content: string;
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        content = this.convertToCSV(data);
        break;
      case 'sql':
        content = this.convertToSQL(tableName, data);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Compress if enabled
    const config = this.configService.get<ArchiveConfig>('archive');
    if (config.globalSettings.compressionEnabled) {
      const compressed = await this.gzip(Buffer.from(content));
      await fs.writeFile(`${filePath}.gz`, compressed);
      return `${filename}.gz`;
    } else {
      await fs.writeFile(filePath, content);
      return filename;
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  private convertToSQL(tableName: string, data: any[]): string {
    if (data.length === 0) return '';
    
    const columns = Object.keys(data[0]);
    const values = data.map(row => 
      `(${columns.map(col => {
        const value = row[col];
        return typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
      }).join(', ')})`
    ).join(',\n');
    
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES\n${values};`;
  }

  async getArchiveStatistics(): Promise<any> {
    const stats = await this.archiveMetadataRepository
      .createQueryBuilder('archive')
      .select([
        'archive.sourceTable as table_name',
        'archive.status',
        'COUNT(*) as count',
        'SUM(archive.dataSize) as total_size',
        'MIN(archive.archiveDate) as earliest_archive',
        'MAX(archive.archiveDate) as latest_archive',
      ])
      .groupBy('archive.sourceTable, archive.status')
      .getRawMany();

    return stats;
  }
}