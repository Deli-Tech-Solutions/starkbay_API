import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobProcessorService } from './services/job-processor.service';
import { JobSchedulerService } from './services/job-scheduler.service';
import { JobStatusService } from './services/job-status.service';
import { JobHistoryService } from './services/job-history.service';
import { JobMonitoringService } from './services/job-monitoring.service';
import { JobController } from './controllers/job.controller';
import { JobDashboardController } from './controllers/job-dashboard.controller';
import { JobHistory } from './entities/job-history.entity';
import { JobConfiguration } from './entities/job-configuration.entity';
import { EmailProcessor } from './processors/email.processor';
import { DataProcessor } from './processors/data.processor';
import { ReportProcessor } from './processors/report.processor';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue(
      { name: 'email-queue' },
      { name: 'data-processing-queue' },
      { name: 'report-generation-queue' },
      { name: 'notification-queue' },
      { name: 'high-priority-queue' },
      { name: 'low-priority-queue' },
    ),
    TypeOrmModule.forFeature([JobHistory, JobConfiguration]),
  ],
  providers: [
    JobProcessorService,
    JobSchedulerService,
    JobStatusService,
    JobHistoryService,
    JobMonitoringService,
    EmailProcessor,
    DataProcessor,
    ReportProcessor,
    NotificationProcessor,
  ],
  controllers: [JobController, JobDashboardController],
  exports: [
    JobProcessorService,
    JobSchedulerService,
    JobStatusService,
    JobHistoryService,
  ],
})
export class JobProcessingModule {}

// jobProcessing/entities/job-history.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum JobStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
  STUCK = 'stuck',
}

export enum JobPriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

@Entity('job_history')
@Index(['status', 'createdAt'])
@Index(['jobType', 'createdAt'])
@Index(['priority', 'createdAt'])
export class JobHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  jobId: string;

  @Column()
  jobType: string;

  @Column()
  queueName: string;

  @Column({ type: 'enum', enum: JobStatus })
  status: JobStatus;

  @Column({ type: 'enum', enum: JobPriority, default: JobPriority.NORMAL })
  priority: JobPriority;

  @Column({ type: 'json', nullable: true })
  data: any;

  @Column({ type: 'json', nullable: true })
  result: any;

  @Column({ type: 'json', nullable: true })
  error: any;

  @Column({ default: 0 })
  attempts: number;

  @Column({ default: 0 })
  maxAttempts: number;

  @Column({ type: 'bigint', nullable: true })
  delay: number;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ type: 'bigint', nullable: true })
  processingTime: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}