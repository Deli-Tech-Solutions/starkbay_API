import { TransactionStatus } from 'src/common/types/transaction.types';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('transaction_logs')
@Index(['transactionId', 'timestamp'])
@Index(['status', 'timestamp'])
export class TransactionLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transaction_id' })
  @Index()
  transactionId: string;

  @Column()
  operation: string;

  @Column({ name: 'table_name' })
  tableName: string;

  @Column({ type: 'json', nullable: true })
  data: any;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'integer', default: 0 })
  duration: number;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ nullable: true })
  error: string;

  @Column({ name: 'isolation_level' })
  isolationLevel: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;
}
