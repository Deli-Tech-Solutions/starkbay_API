import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('job_configuration')
export class JobConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  jobType: string;

  @Column({ default: 3 })
  maxAttempts: number;

  @Column({ default: 5000 })
  backoffDelay: number;

  @Column({ default: 'exponential' })
  backoffStrategy: string;

  @Column({ default: 300000 }) // 5 minutes
  jobTimeout: number;

  @Column({ default: true })
  removeOnComplete: boolean;

  @Column({ default: 10 })
  removeOnCompleteCount: number;

  @Column({ default: true })
  removeOnFail: boolean;

  @Column({ default: 50 })
  removeOnFailCount: number;

  @Column({ type: 'json', nullable: true })
  defaultJobOptions: any;

  @Column({ default: true })
  enabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// jobProcessing/interfaces/job.interface.ts
export interface JobData {
  id?: string;
  type: string;
  payload: any;
  metadata?: {
    userId?: string;
    correlationId?: string;
    source?: string;
    [key: string]: any;
  };
}

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: string;
    delay: number;
  };
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  jobId?: string;
  repeat?: {
    pattern?: string;
    every?: number;
    limit?: number;
  };
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
