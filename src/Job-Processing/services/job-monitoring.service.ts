import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JobStatusService } from './job-status.service';
import { JobHistoryService } from './job-history.service';

@Injectable()
export class JobMonitoringService {
  private readonly logger = new Logger(JobMonitoringService.name);
  private alerts = new Map<string, any>();

  constructor(
    private jobStatusService: JobStatusService,
    private jobHistoryService: JobHistoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createAlert(name: string, condition: any, action: any) {
    this.alerts.set(name, { condition, action });
    this.logger.log(`Alert created: ${name}`);
  }

  async removeAlert(name: string) {
    this.alerts.delete(name);
    this.logger.log(`Alert removed: ${name}`);
  }

  async checkAlerts() {
    for (const [name, alert] of this.alerts.entries()) {
      try {
        const shouldTrigger = await this.evaluateCondition(alert.condition);
        if (shouldTrigger) {
          await this.executeAction(name, alert.action);
        }
      } catch (error) {
        this.logger.error(`Error checking alert ${name}:`, error);
      }
    }
  }

  async getSystemHealth() {
    const stats = await this.jobStatusService.getAllQueuesStats();
    const jobStats = await this.jobHistoryService.getJobStatistics('day');
    
    const totalJobs = Object.values(stats).reduce((sum: number, queueStats: any) => sum + queueStats.total, 0);
    const failedJobs = Object.values(stats).reduce((sum: number, queueStats: any) => sum + queueStats.failed, 0);
    const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

    return {
      queues: stats,
      jobStatistics: jobStats,
      systemMetrics: {
        totalJobs,
        failedJobs,
        failureRate,
        timestamp: new Date(),
      },
    };
  }

  async getPerformanceMetrics() {
    const avgProcessingTime = await this.jobHistoryService.getAverageProcessingTime();
    const stats = await this.jobHistoryService.getJobStatistics('hour');
    
    return {
      averageProcessingTime: avgProcessingTime,
      hourlyStats: stats,
      timestamp: new Date(),
    };
  }

  private async evaluateCondition(condition: any): Promise<boolean> {
    // Implementation for evaluating alert conditions
    switch (condition.type) {
      case 'failure_rate':
        const health = await this.getSystemHealth();
        return health.systemMetrics.failureRate > condition.threshold;
      case 'queue_size':
        const stats = await this.jobStatusService.getQueueStats(condition.queueName);
        return stats.waiting > condition.threshold;
      default:
        return false;
    }
  }

  private async executeAction(alertName: string, action: any) {
    this.logger.warn(`Alert triggered: ${alertName}`);
    
    switch (action.type) {
      case 'email':
        this.eventEmitter.emit('alert.email', { alertName, action });
        break;
      case 'webhook':
        this.eventEmitter.emit('alert.webhook', { alertName, action });
        break;
      case 'log':
        this.logger.error(`ALERT: ${alertName} - ${action.message}`);
        break;
    }
  }
}
