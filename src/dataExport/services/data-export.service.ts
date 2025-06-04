import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-writer';
import * as xlsx from 'xlsx';
import { ExportLog, ExportStatus, ExportFormat } from '../entities/export-log.entity';
import { ExportConfig } from '../entities/export-config.entity';
import { ExportDataDto } from '../dto/export-data.dto';

@Injectable()
export class DataExportService {
  constructor(
    @InjectRepository(ExportLog)
    private exportLogRepository: Repository<ExportLog>,
    @InjectRepository(ExportConfig)
    private exportConfigRepository: Repository<ExportConfig>,
    @InjectQueue('export-queue')
    private exportQueue: Queue,
    private dataSource: DataSource,
  ) {}

  async exportData(userId: string, exportDto: ExportDataDto): Promise<ExportLog> {
    const exportLog = this.exportLogRepository.create({
      userId,
      tableName: exportDto.tableName,
      format: exportDto.format,
      filters: exportDto.filters,
      columns: exportDto.columns,
      status: ExportStatus.PENDING,
    });

    await this.exportLogRepository.save(exportLog);

    // For large datasets, queue the job
    const recordCount = await this.getRecordCount(exportDto.tableName, exportDto.filters);
    
    if (recordCount > 1000) {
      await this.exportQueue.add('processExport', {
        exportLogId: exportLog.id,
        exportDto,
      });
    } else {
      // Process immediately for small datasets
      await this.processExport(exportLog.id, exportDto);
    }

    return exportLog;
  }

  async processExport(exportLogId: string, exportDto: ExportDataDto): Promise<void> {
    const exportLog = await this.exportLogRepository.findOne({ where: { id: exportLogId } });
    if (!exportLog) throw new BadRequestException('Export log not found');

    try {
      exportLog.status = ExportStatus.PROCESSING;
      await this.exportLogRepository.save(exportLog);

      const data = await this.fetchData(exportDto.tableName, exportDto.filters, exportDto.columns);
      const filePath = await this.generateFile(data, exportLog.format, exportDto.fileName || `export_${Date.now()}`);

      exportLog.status = ExportStatus.COMPLETED;
      exportLog.filePath = filePath;
      exportLog.totalRecords = data.length;
      exportLog.processedRecords = data.length;
      exportLog.completedAt = new Date();

    } catch (error) {
      exportLog.status = ExportStatus.FAILED;
      exportLog.errorMessage = error.message;
    }

    await this.exportLogRepository.save(exportLog);
  }

  private async fetchData(tableName: string, filters?: any, columns?: string[]): Promise<any[]> {
    const queryBuilder = this.dataSource.createQueryBuilder().from(tableName, tableName);

    if (columns && columns.length > 0) {
      queryBuilder.select(columns.map(col => `${tableName}.${col}`));
    } else {
      queryBuilder.select('*');
    }

    if (filters) {
      Object.keys(filters).forEach(key => {
        queryBuilder.andWhere(`${tableName}.${key} = :${key}`, { [key]: filters[key] });
      });
    }

    return await queryBuilder.getRawMany();
  }

  private async getRecordCount(tableName: string, filters?: any): Promise<number> {
    const queryBuilder = this.dataSource.createQueryBuilder().from(tableName, tableName);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        queryBuilder.andWhere(`${tableName}.${key} = :${key}`, { [key]: filters[key] });
      });
    }

    return await queryBuilder.getCount();
  }

  private async generateFile(data: any[], format: ExportFormat, fileName: string): Promise<string> {
    const exportDir = path.join(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const filePath = path.join(exportDir, `${fileName}.${format}`);

    switch (format) {
      case ExportFormat.CSV:
        await this.generateCSV(data, filePath);
        break;
      case ExportFormat.JSON:
        await this.generateJSON(data, filePath);
        break;
      case ExportFormat.XLSX:
        await this.generateXLSX(data, filePath);
        break;
      case ExportFormat.XML:
        await this.generateXML(data, filePath);
        break;
    }

    return filePath;
  }

  private async generateCSV(data: any[], filePath: string): Promise<void> {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).map(key => ({ id: key, title: key }));
    const csvWriter = csv.createObjectCsvWriter({
      path: filePath,
      header: headers,
    });

    await csvWriter.writeRecords(data);
  }

  private async generateJSON(data: any[], filePath: string): Promise<void> {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  private async generateXLSX(data: any[], filePath: string): Promise<void> {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data');
    xlsx.writeFile(workbook, filePath);
  }

  private async generateXML(data: any[], filePath: string): Promise<void> {
    const xmlData = data.map(item => {
      const xmlItem = Object.keys(item).map(key => `<${key}>${item[key]}</${key}>`).join('');
      return `<item>${xmlItem}</item>`;
    }).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?><data>${xmlData}</data>`;
    fs.writeFileSync(filePath, xml);
  }

  async getExportStatus(exportId: string): Promise<ExportLog> {
    return await this.exportLogRepository.findOne({ where: { id: exportId } });
  }

  async downloadExport(exportId: string): Promise<string> {
    const exportLog = await this.exportLogRepository.findOne({ where: { id: exportId } });
    if (!exportLog || exportLog.status !== ExportStatus.COMPLETED) {
      throw new BadRequestException('Export not found or not completed');
    }
    return exportLog.filePath;
  }
}
