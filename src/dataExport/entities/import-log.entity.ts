import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum ImportStatus {
  PENDING = 'pending',
  VALIDATING = 'validating',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('import_logs')
export class ImportLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  tableName: string;

  @Column()
  fileName: string;

  @Column({ type: 'enum', enum: ImportStatus, default: ImportStatus.PENDING })
  status: ImportStatus;

  @Column({ type: 'json', nullable: true })
  validationErrors: any[];

  @Column({ type: 'json', nullable: true })
  processingErrors: any[];

  @Column({ default: 0 })
  totalRecords: number;

  @Column({ default: 0 })
  successfulRecords: number;

  @Column({ default: 0 })
  failedRecords: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
