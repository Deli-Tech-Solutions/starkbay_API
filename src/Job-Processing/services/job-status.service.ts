import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobHistoryService } from './job-history.service';

@Injectable()
export class JobStatusService {
  private readonly logger = new Logger(JobStatusService.name);

  constructor(
    @InjectQueue('email-queue') private emailQueue: Queue,
    @InjectQueue('data-processing-queue') private dataQueue: Queue,
    @InjectQueue('report-generation-queue') private reportQueue: Queue,
    @InjectQueue('notification-queue') private notificationQueue: Queue,
    @InjectQueue('high-priority-queue') private highPriorityQueue: Queue,
    @InjectQueue('low-priority-queue') private lowPriorityQueue: Queue,
    private jobHistoryService: JobHistoryService,
  ) {}

  async getJobStatus(queueName: string, jobId: string) {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      
      if (!job) {
        return null;
      }

      const state = await job.getState();
      const progress = job.progress;
      
      return {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        progress,
        state,
        attemptsMade: job.attemptsMade,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        stacktrace: job.stacktrace,
        returnvalue: job.returnvalue,
      };
    } catch (error) {
      this.logger.error(`Failed to get job status for ${jobId}:`, error);
      throw error;
    }
  }

  async getQueueStats(queueName: string) {
    try {
      const queue = this.getQueue(queueName);
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      const completed = await queue.getCompleted();
      const failed = await queue.getFailed();
      const delayed = await queue.getDelayed();
      const paused = await queue.getPaused();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: paused.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length + paused.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats for ${queueName}:`, error);
      throw error;
    }
  }

  async getAllQueuesStats() {
    const queueNames = [
      'email-queue',
      'data-processing-queue',
      'report-generation-queue',
      'notification-queue',
      'high-priority-queue',
      'low-priority-queue',
    ];

    const stats = {};
    for (const queueName of queueNames) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }

  async getJobHistory(filters: any = {}) {
    return this.jobHistoryService.getJobHistory(filters);
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
}
