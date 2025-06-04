import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataExportService } from './services/data-export.service';
import { DataImportService } from './services/data-import.service';
import { ExportJobProcessor } from './processors/export-job.processor';
import { DataExportController } from './controllers/data-export.controller';
import { DataImportController } from './controllers/data-import.controller';
import { ExportLog } from './entities/export-log.entity';
import { ImportLog } from './entities/import-log.entity';
import { ExportConfig } from './entities/export-config.entity';
import { ImportConfig } from './entities/import-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExportLog, ImportLog, ExportConfig, ImportConfig]),
    BullModule.registerQueue({
      name: 'export-queue',
    }),
  ],
  controllers: [DataExportController, DataImportController],
  providers: [DataExportService, DataImportService, ExportJobProcessor],
  exports: [DataExportService, DataImportService],
})
export class DataExportModule {}

// dataExport/entities/export-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
  XML = 'xml',
}

@Entity('export_logs')
export class ExportLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  tableName: string;

  @Column({ type: 'enum', enum: ExportFormat })
  format: ExportFormat;

  @Column({ type: 'enum', enum: ExportStatus, default: ExportStatus.PENDING })
  status: ExportStatus;

  @Column({ nullable: true })
  filePath: string;

  @Column({ type: 'json', nullable: true })
  filters: any;

  @Column({ type: 'json', nullable: true })
  columns: string[];

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ default: 0 })
  totalRecords: number;

  @Column({ default: 0 })
  processedRecords: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
