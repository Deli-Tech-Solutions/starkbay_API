import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobProcessorService } from './job-processor.service';
import { JobData, JobOptions } from '../interfaces/job.interface';

@Injectable()
export class JobSchedulerService {
  private readonly logger = new Logger(JobSchedulerService.name);
  private scheduledJobs = new Map<string, any>();

  constructor(private jobProcessor: JobProcessorService) {}

  async scheduleJob(
    name: string,
    queueName: string,
    jobData: JobData,
    cronPattern: string,
    options: JobOptions = {},
  ) {
    try {
      const jobOptions: JobOptions = {
        ...options,
        repeat: {
          pattern: cronPattern,
          ...options.repeat,
        },
      };

      const job = await this.jobProcessor.addJob(queueName, jobData, jobOptions);
      this.scheduledJobs.set(name, job);
      
      this.logger.log(`Scheduled job: ${name} with pattern: ${cronPattern}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to schedule job: ${name}`, error);
      throw error;
    }
  }

  async scheduleDelayedJob(
    queueName: string,
    jobData: JobData,
    delayMs: number,
    options: JobOptions = {},
  ) {
    const jobOptions: JobOptions = {
      ...options,
      delay: delayMs,
    };

    return this.jobProcessor.addJob(queueName, jobData, jobOptions);
  }

  async cancelScheduledJob(name: string) {
    const job = this.scheduledJobs.get(name);
    if (job) {
      await job.remove();
      this.scheduledJobs.delete(name);
      this.logger.log(`Cancelled scheduled job: ${name}`);
      return true;
    }
    return false;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldJobs() {
    this.logger.log('Running scheduled cleanup of old jobs');
    // Implementation for cleaning up old job records
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorStuckJobs() {
    this.logger.log('Monitoring for stuck jobs');
    // Implementation for detecting and handling stuck jobs
  }
}