import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as xlsx from 'xlsx';
import { ImportLog, ImportStatus } from '../entities/import-log.entity';
import { ImportConfig } from '../entities/import-config.entity';
import { ImportDataDto } from '../dto/import-data.dto';

@Injectable()
export class DataImportService {
  constructor(
    @InjectRepository(ImportLog)
    private importLogRepository: Repository<ImportLog>,
    @InjectRepository(ImportConfig)
    private importConfigRepository: Repository<ImportConfig>,
    private dataSource: DataSource,
  ) {}

  async importData(userId: string, file: Express.Multer.File, importDto: ImportDataDto): Promise<ImportLog> {
    const importLog = this.importLogRepository.create({
      userId,
      tableName: importDto.tableName,
      fileName: file.originalname,
      status: ImportStatus.PENDING,
    });

    await this.importLogRepository.save(importLog);

    try {
      const data = await this.parseFile(file);
      const config = importDto.configId 
        ? await this.importConfigRepository.findOne({ where: { id: importDto.configId } })
        : null;

      const columnMapping = importDto.columnMapping || config?.columnMapping || {};
      
      importLog.totalRecords = data.length;
      importLog.status = ImportStatus.VALIDATING;
      await this.importLogRepository.save(importLog);

      const validationResult = await this.validateData(data, importDto.tableName, columnMapping, config);
      
      if (validationResult.errors.length > 0) {
        importLog.validationErrors = validationResult.errors;
        if (importDto.options?.validateOnly) {
          importLog.status = ImportStatus.COMPLETED;
          await this.importLogRepository.save(importLog);
          return importLog;
        }
      }

      importLog.status = ImportStatus.PROCESSING;
      await this.importLogRepository.save(importLog);

      const processResult = await this.processData(
        validationResult.validData, 
        importDto.tableName, 
        columnMapping,
        importDto.options
      );

      importLog.status = ImportStatus.COMPLETED;
      importLog.successfulRecords = processResult.successful;
      importLog.failedRecords = processResult.failed;
      importLog.processingErrors = processResult.errors;
      importLog.completedAt = new Date();

    } catch (error) {
      importLog.status = ImportStatus.FAILED;
      importLog.validationErrors = [{ message: error.message }];
    }

    await this.importLogRepository.save(importLog);
    return importLog;
  }

  private async parseFile(file: Express.Multer.File): Promise<any[]> {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
        return this.parseCSV(file.buffer);
      case 'json':
        return JSON.parse(file.buffer.toString());
      case 'xlsx':
      case 'xls':
        return this.parseXLSX(file.buffer);
      default:
        throw new BadRequestException('Unsupported file format');
    }
  }

  private async parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = require('stream');
      const readable = new stream.Readable();
      readable.push(buffer);
      readable.push(null);

      readable
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private parseXLSX(buffer: Buffer): any[] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(worksheet);
  }

  private async validateData(
    data: any[], 
    tableName: string, 
    columnMapping: Record<string, string>,
    config: ImportConfig
  ): Promise<{ validData: any[], errors: any[] }> {
    const errors: any[] = [];
    const validData: any[] = [];

    const tableMetadata = await this.getTableMetadata(tableName);
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowErrors: string[] = [];
      
      // Map columns
      const mappedRow: any = {};
      Object.keys(row).forEach(key => {
        const mappedKey = columnMapping[key] || key;
        mappedRow[mappedKey] = row[key];
      });

      // Validate required fields
      tableMetadata.requiredColumns.forEach(column => {
        if (!mappedRow[column] || mappedRow[column] === '') {
          rowErrors.push(`Missing required field: ${column}`);
        }
      });

      // Validate data types
      Object.keys(mappedRow).forEach(key => {
        const columnMeta = tableMetadata.columns[key];
        if (columnMeta && !this.validateDataType(mappedRow[key], columnMeta.type)) {
          rowErrors.push(`Invalid data type for ${key}: expected ${columnMeta.type}`);
        }
      });

      // Custom validation rules
      if (config?.validationRules) {
        const customErrors = this.applyCustomValidation(mappedRow, config.validationRules);
        rowErrors.push(...customErrors);
      }

      if (rowErrors.length > 0) {
        errors.push({ row: i + 1, errors: rowErrors });
      } else {
        validData.push(mappedRow);
      }
    }

    return { validData, errors };
  }

  private async getTableMetadata(tableName: string): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    const table = await queryRunner.getTable(tableName);
    await queryRunner.release();

    const columns: Record<string, any> = {};
    const requiredColumns: string[] = [];

    table.columns.forEach(column => {
      columns[column.name] = {
        type: column.type,
        nullable: column.isNullable,
      };
      
      if (!column.isNullable && !column.isGenerated) {
        requiredColumns.push(column.name);
      }
    });

    return { columns, requiredColumns };
  }

  private validateDataType(value: any, expectedType: string): boolean {
    if (value === null || value === undefined) return true;

    switch (expectedType.toLowerCase()) {
      case 'varchar':
      case 'text':
      case 'char':
        return typeof value === 'string';
      case 'int':
      case 'integer':
      case 'bigint':
        return !isNaN(parseInt(value));
      case 'decimal':
      case 'float':
      case 'double':
        return !isNaN(parseFloat(value));
      case 'boolean':
        return typeof value === 'boolean' || ['true', 'false', '1', '0'].includes(value?.toString().toLowerCase());
      case 'date':
      case 'datetime':
      case 'timestamp':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  private applyCustomValidation(row: any, rules: any): string[] {
    const errors: string[] = [];
    // Implementation for custom validation rules
    // This would be expanded based on specific business needs
    return errors;
  }

  private async processData(
    data: any[], 
    tableName: string, 
    columnMapping: Record<string, string>,
    options?: any
  ): Promise<{ successful: number, failed: number, errors: any[] }> {
    let successful = 0;
    let failed = 0;
    const errors: any[] = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i];
          
          if (options?.skipDuplicates) {
            const exists = await this.checkDuplicate(queryRunner, tableName, row);
            if (exists) continue;
          }

          if (options?.updateExisting) {
            await this.upsertRecord(queryRunner, tableName, row);
          } else {
            await queryRunner.manager.insert(tableName, row);
          }
          
          successful++;
        } catch (error) {
          failed++;
          errors.push({ row: i + 1, error: error.message });
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return { successful, failed, errors };
  }

  private async checkDuplicate(queryRunner: any, tableName: string, row: any): Promise<boolean> {
    // Implementation to check for duplicates based on unique constraints
    // This would need to be customized based on table structure
    return false;
  }

  private async upsertRecord(queryRunner: any, tableName: string, row: any): Promise<void> {
    // Implementation for upsert logic
    // This would need to be customized based on table structure and business rules
  }

  async getImportStatus(importId: string): Promise<ImportLog> {
    return await this.importLogRepository.findOne({ where: { id: importId } });
  }

  async getImportReport(importId: string): Promise<any> {
    const importLog = await this.importLogRepository.findOne({ where: { id: importId } });
    if (!importLog) throw new BadRequestException('Import log not found');

    return {
      id: importLog.id,
      status: importLog.status,
      totalRecords: importLog.totalRecords,
      successfulRecords: importLog.successfulRecords,
      failedRecords: importLog.failedRecords,
      validationErrors: importLog.validationErrors,
      processingErrors: importLog.processingErrors,
      createdAt: importLog.createdAt,
      completedAt: importLog.completedAt,
    };
  }
}
