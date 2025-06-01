import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

interface AlertThreshold {
  slowQueryCount: number;
  unusedIndexSizeBytes: number;
  fragmentationPercentage: number;
  lowCacheHitRatio: number;
}

@Injectable()
export class PerformanceAlertsService {
  private readonly logger = new Logger(PerformanceAlertsService.name);
  private readonly thresholds: AlertThreshold;

  constructor(
    private dataSource: DataSource,
    private configService: ConfigService
  ) {
    this.thresholds = {
      slowQueryCount: this.configService.get('ALERT_SLOW_QUERY_COUNT', 10),
      unusedIndexSizeBytes: this.configService.get('ALERT_UNUSED_INDEX_SIZE', 100 * 1024 * 1024), // 100MB
      fragmentationPercentage: this.configService.get('ALERT_FRAGMENTATION_THRESHOLD', 30),
      lowCacheHitRatio: this.configService.get('ALERT_CACHE_HIT_RATIO', 85),
    };
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkPerformanceThresholds(): Promise<void> {
    const alerts: string[] = [];

    // Check for slow queries
    const slowQueryCount = await this.getSlowQueryCount();
    if (slowQueryCount > this.thresholds.slowQueryCount) {
      alerts.push(`High number of slow queries: ${slowQueryCount} queries > 1 second`);
    }

    // Check for unused indexes
    const unusedIndexSize = await this.getUnusedIndexSize();
    if (unusedIndexSize > this.thresholds.unusedIndexSizeBytes) {
      alerts.push(`Large unused indexes: ${Math.round(unusedIndexSize / 1024 / 1024)}MB wasted space`);
    }

    // Check for fragmented indexes
    const fragmentedIndexes = await this.getFragmentedIndexes();
    if (fragmentedIndexes.length > 0) {
      alerts.push(`${fragmentedIndexes.length} indexes need maintenance due to fragmentation`);
    }

    // Check cache hit ratio
    const cacheHitRatio = await this.getCacheHitRatio();
    if (cacheHitRatio < this.thresholds.lowCacheHitRatio) {
      alerts.push(`Low cache hit ratio: ${cacheHitRatio.toFixed(2)}% (target: ${this.thresholds.lowCacheHitRatio}%)`);
    }

    // Send alerts if any issues found
    if (alerts.length > 0) {
      await this.sendPerformanceAlert(alerts);
    }
  }

  private async getSlowQueryCount(): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT COUNT(*) as count
      FROM pg_stat_statements 
      WHERE mean_time > 1000 -- 1 second
        AND calls > 10
    `);
    return parseInt(result[0]?.count || 0);
  }

  private async getUnusedIndexSize(): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT COALESCE(SUM(pg_relation_size(indexrelid)), 0) as total_size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_unique%'
    `);
    return parseInt(result[0]?.total_size || 0);
  }

  private async getFragmentedIndexes(): Promise<string[]> {
    const result = await this.dataSource.query(`
      SELECT indexname
      FROM pg_stat_user_indexes
      WHERE avg_leaf_density < ${100 - this.thresholds.fragmentationPercentage}
        AND pg_relation_size(indexrelid) > 10 * 1024 * 1024 -- > 10MB
    `);
    return result.map(row => row.indexname);
  }

  private async getCacheHitRatio(): Promise<number> {
    const result = await this.dataSource.query(`
      SELECT 
        100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)) as cache_hit_ratio
      FROM pg_stat_database
      WHERE datname = current_database()
    `);
    return parseFloat(result[0]?.cache_hit_ratio || 0);
  }

  private async sendPerformanceAlert(alerts: string[]): Promise<void> {
    const alertMessage = `
Database Performance Alert - ${new Date().toISOString()}

Issues detected:
${alerts.map(alert => `• ${alert}`).join('\n')}

Please review database performance and consider taking action.
    `.trim();

    this.logger.warn('Performance Alert Triggered', {
      alertCount: alerts.length,
      alerts,
      timestamp: new Date().toISOString()
    });

    // Here you would integrate with your notification system
    // Examples: Slack, email, SMS, PagerDuty, etc.
    await this.sendToNotificationService(alertMessage);
  }

  private async sendToNotificationService(message: string): Promise<void> {
    // Implementation depends on your notification service
    // Example integrations:
    
    // Slack webhook
    // await this.slackService.sendAlert(message);
    
    // Email notification
    // await this.emailService.sendAlert(message);
    
    // For now, just log the alert
    this.logger.warn(`PERFORMANCE ALERT: ${message}`);
  }
}
