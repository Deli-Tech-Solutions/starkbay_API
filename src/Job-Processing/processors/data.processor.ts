import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobHistoryService } from '../services/job-history.service';
import { JobStatus } from '../entities/job-history.entity';

@Processor('data-processing-queue')
export class DataProcessor extends WorkerHost {
  private readonly logger = new Logger(DataProcessor.name);

  constructor(private jobHistoryService: JobHistoryService) {
    super();
  }

  async process(job: Job): Promise<any> {
    const startTime = Date.now();
    
    try {
      await this.jobHistoryService.updateJobHistory(job.id.toString(), {
        status: JobStatus.ACTIVE,
      });

      this.logger.log(`Processing data job: ${job.id}`);
      
      const result = await this.processData(job.data);
      
      const processingTime = Date.now() - startTime;
      
      await this.jobHistoryService.updateJobHistory(job.id.toString(), {
        status: JobStatus.COMPLETED,
        processedAt: new Date(),
        processingTime,
        result,
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      await this.jobHistoryService.updateJobHistory(job.id.toString(), {
        status: JobStatus.FAILED,
        failedAt: new Date(),
        processingTime,
        error: { message: error.message, stack: error.stack },
      });

      this.logger.error(`Data processing job failed: ${job.id}`, error);
      throw error;
    }
  }

  private async processData(data: any): Promise<any> {
    // Simulate data processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      processedRecords: Math.floor(Math.random() * 1000),
      processingTime: Date.now(),
      success: true,
    };
  }
}
