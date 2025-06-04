import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ExportFormat } from './export-log.entity';

@Entity('export_configs')
export class ExportConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  tableName: string;

  @Column({ type: 'enum', enum: ExportFormat })
  format: ExportFormat;

  @Column({ type: 'json', nullable: true })
  defaultFilters: any;

  @Column({ type: 'json', nullable: true })
  defaultColumns: string[];

  @Column({ type: 'json', nullable: true })
  formatOptions: any;

  @Column({ default: false })
  isScheduled: boolean;

  @Column({ nullable: true })
  cronExpression: string;

  @CreateDateColumn()
  createdAt: Date;
}
