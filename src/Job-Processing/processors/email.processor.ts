import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobHistoryService } from '../services/job-history.service';
import { JobStatus } from '../entities/job-history.entity';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private jobHistoryService: JobHistoryService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const startTime = Date.now();
    
    try {
      await this.jobHistoryService.updateJobHistory(job.id.toString(), {
        status: JobStatus.ACTIVE,
      });

      this.logger.log(`Processing email job: ${job.id}`);
      
      // Simulate email processing
      await this.sendEmail(job.data);
      
      const processingTime = Date.now() - startTime;
      
      await this.jobHistoryService.updateJobHistory(job.id.toString(), {
        status: JobStatus.COMPLETED,
        processedAt: new Date(),
        processingTime,
        result: { success: true, emailSent: true },
      });

      return { success: true, processingTime };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await this.jobHistoryService.updateJobHistory(job.id.toString(), {
        status: JobStatus.FAILED,
        failedAt: new Date(),
        processingTime,
        error: { message: error.message, stack: error.stack },
      });

      this.logger.error(`Email job failed: ${job.id}`, error);
      throw error;
    }
  }

  private async sendEmail(data: any): Promise<void> {
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (Math.random() < 0.1) { // 10% failure rate for testing
      throw new Error('Email service unavailable');
    }
  }
}