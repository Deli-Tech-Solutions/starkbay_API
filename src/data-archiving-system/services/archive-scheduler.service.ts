import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { ArchiveService } from './archive.service';
import { ArchiveConfig } from '../interfaces/archive-config.interface';

@Injectable()
export class ArchiveSchedulerService {
  private readonly logger = new Logger(ArchiveSchedulerService.name);
  private runningJobs = new Set<string>();

  constructor(
    private archiveService: ArchiveService,
    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDailyArchiving(): Promise<void> {
    this.logger.log('Starting daily archive job');
    
    const config = this.configService.get<ArchiveConfig>('archive');
    const maxConcurrentJobs = config.globalSettings.maxConcurrentJobs;

    const enabledCriteria = config.criteria.filter(c => c.enabled);
    
    // Process tables in batches to respect concurrency limits
    for (let i = 0; i < enabledCriteria.length; i += maxConcurrentJobs) {
      const batch = enabledCriteria.slice(i, i + maxConcurrentJobs);
      
      const promises = batch.map(async (criteria) => {
        if (this.runningJobs.has(criteria.tableName)) {
          this.logger.warn(`Archive job already running for ${criteria.tableName}, skipping`);
          return;
        }

        this.runningJobs.add(criteria.tableName);
        try {
          await this.archiveService.archiveTable(criteria.tableName, criteria);
        } catch (error) {
          this.logger.error(`Archive job failed for ${criteria.tableName}:`, error);
        } finally {
          this.runningJobs.delete(criteria.tableName);
        }
      });

      await Promise.all(promises);
    }

    this.logger.log('Daily archive job completed');
  }

  @Cron(CronExpression.EVERY_SUNDAY_AT_3AM)
  async runWeeklyPurge(): Promise<void> {
    this.logger.log('Starting weekly purge job');
    
    try {
      await this.archiveService.purgeOldArchives();
      this.logger.log('Weekly purge job completed');
    } catch (error) {
      this.logger.error('Weekly purge job failed:', error);
    }
  }

  // Manual trigger for testing
  async triggerArchiveJob(tableName: string): Promise<string> {
    if (this.runningJobs.has(tableName)) {
      throw new Error(`Archive job already running for ${tableName}`);
    }

    this.runningJobs.add(tableName);
    try {
      return await this.archiveService.archiveTable(tableName);
    } finally {
      this.runningJobs.delete(tableName);
    }
  }
}
