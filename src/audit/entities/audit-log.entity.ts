import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  entityType: string;

  @Column()
  @Index()
  entityId: string;

  @Column()
  action: string;

  @Column({ type: 'jsonb', nullable: true })
  beforeState: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  afterState: Record<string, any>;

  @Column()
  userId: string;

  @Column({ nullable: true })
  userIp: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  @Index()
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
} 