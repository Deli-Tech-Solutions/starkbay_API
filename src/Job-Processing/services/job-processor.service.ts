import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobData, JobOptions } from '../interfaces/job.interface';
import { JobPriority } from '../entities/job-history.entity';
import { JobHistoryService } from './job-history.service';

@Injectable()
export class JobProcessorService {
  private readonly logger = new Logger(JobProcessorService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('data-processing-queue') private dataQueue: Queue,
    @InjectQueue('report-generation-queue') private reportQueue: Queue,
    @InjectQueue('notification-queue') private notificationQueue: Queue,
    @InjectQueue('high-priority-queue') private highPriorityQueue: Queue,
    @InjectQueue('low-priority-queue') private lowPriorityQueue: Queue,
    private jobHistoryService: JobHistoryService,
  ) {}

  async addJob(queueName: string, jobData: JobData, options: JobOptions = {}) {
    try {
      const queue = this.getQueue(queueName);
      const jobOptions = this.buildJobOptions(options);
      
      const job = await queue.add(jobData.type, jobData, jobOptions);
      
      await this.jobHistoryService.createJobHistory({
        jobId: job.id.toString(),
        jobType: jobData.type,
        queueName,
        data: jobData,
        priority: options.priority || JobPriority.NORMAL,
        maxAttempts: options.attempts || 3,
      });

      this.logger.log(`Job added: ${job.id} to queue: ${queueName}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${queueName}:`, error);
      throw error;
    }
  }

  async addBulkJobs(queueName: string, jobs: Array<{ data: JobData; options?: JobOptions }>) {
    try {
      const queue = this.getQueue(queueName);
      const bulkJobs = jobs.map(({ data, options = {} }) => ({
        name: data.type,
        data,
        opts: this.buildJobOptions(options),
      }));

      const addedJobs = await queue.addBulk(bulkJobs);
      
      for (const job of addedJobs) {
        await this.jobHistoryService.createJobHistory({
          jobId: job.id.toString(),
          jobType: job.name,
          queueName,
          data: job.data,
          priority: JobPriority.NORMAL,
          maxAttempts: 3,
        });
      }

      this.logger.log(`Bulk jobs added: ${addedJobs.length} jobs to queue: ${queueName}`);
      return addedJobs;
    } catch (error) {
      this.logger.error(`Failed to add bulk jobs to queue ${queueName}:`, error);
      throw error;
    }
  }

  async removeJob(queueName: string, jobId: string) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      
      if (job) {
        await job.remove();
        this.logger.log(`Job removed: ${jobId} from queue: ${queueName}`);
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to remove job ${jobId} from queue ${queueName}:`, error);
      throw error;
    }
  }

  async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    await queue.pause();
    this.logger.log(`Queue paused: ${queueName}`);
  }

  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    await queue.resume();
    this.logger.log(`Queue resumed: ${queueName}`);
  }

  private getQueue(queueName: string): Queue {
    const queueMap = {
      'email-queue': this.emailQueue,
      'data-processing-queue': this.dataQueue,
      'report-generation-queue': this.reportQueue,
      'notification-queue': this.notificationQueue,
      'high-priority-queue': this.highPriorityQueue,
      'low-priority-queue': this.lowPriorityQueue,
    };

    const queue = queueMap[queueName];
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }
    return queue;
  }

  private buildJobOptions(options: JobOptions): any {
    return {
      priority: options.priority || JobPriority.NORMAL,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: options.backoff || {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: options.removeOnComplete !== undefined ? options.removeOnComplete : 10,
      removeOnFail: options.removeOnFail !== undefined ? options.removeOnFail : 50,
      jobId: options.jobId,
      repeat: options.repeat,
    };
  }
}
