import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('archive_metadata')
@Index(['sourceTable', 'archiveDate'])
@Index(['status'])
export class ArchiveMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sourceTable: string;

  @Column()
  sourceId: string;

  @Column({ type: 'timestamp' })
  archiveDate: Date;

  @Column({ type: 'timestamp' })
  originalCreatedAt: Date;

  @Column({ type: 'json', nullable: true })
  originalData: any;

  @Column({ default: 'archived' })
  status: 'archived' | 'purged' | 'restored';

  @Column({ nullable: true })
  archiveReason: string;

  @Column({ type: 'bigint', default: 0 })
  dataSize: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}