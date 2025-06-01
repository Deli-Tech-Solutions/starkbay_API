import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventPayload } from '../types/event.types';
import { EventStoreService } from './event-store.service';

interface EventMetrics {
  eventType: string;
  count: number;
  averageProcessingTime: number;
  errorRate: number;
  lastProcessed: Date;
}

@Injectable()
export class EventMonitoringService {
  private readonly logger = new Logger(EventMonitoringService.name);
  private readonly eventMetrics = new Map<string, EventMetrics>();
  private readonly processingTimes = new Map<string, number[]>();

  constructor(private readonly eventStore: EventStoreService) {}

  async trackEventEmission(event: EventPayload): Promise<void> {
    const metrics = this.eventMetrics.get(event.type) || {
      eventType: event.type,
      count: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      lastProcessed: new Date()
    };

    metrics.count++;
    metrics.lastProcessed = new Date();
    this.eventMetrics.set(event.type, metrics);

    this.logger.debug(`Event tracked: ${event.type} (Total: ${metrics.count})`);
  }

  async trackEventProcessing(eventType: string, processingTime: number): Promise<void> {
    const times = this.processingTimes.get(eventType) || [];
    times.push(processingTime);

    // Keep only last 100 processing times
    if (times.length > 100) {
      times.shift();
    }

    this.processingTimes.set(eventType, times);

    // Update metrics
    const metrics = this.eventMetrics.get(eventType);
    if (metrics) {
      metrics.averageProcessingTime = times.reduce((a, b) => a + b, 0) / times.length;
      this.eventMetrics.set(eventType, metrics);
    }
  }

  async trackEventError(event: EventPayload, error: Error): Promise<void> {
    const metrics = this.eventMetrics.get(event.type);
    if (metrics) {
      const errorCount = Math.floor(metrics.count * metrics.errorRate) + 1;
      metrics.errorRate = errorCount / metrics.count;
      this.eventMetrics.set(event.type, metrics);
    }

    this.logger.error(`Event error tracked: ${event.type} - ${error.message}`);
  }

  getEventMetrics(eventType?: string): EventMetrics[] {
    if (eventType) {
      const metrics = this.eventMetrics.get(eventType);
      return metrics ? [metrics] : [];
    }

    return Array.from(this.eventMetrics.values());
  }

  @Cron(CronExpression.EVERY_HOUR)
  async generateMetricsReport(): Promise<void> {
    const allMetrics = Array.from(this.eventMetrics.values());
    
    if (allMetrics.length === 0) {
      return;
    }

    this.logger.log('=== Event Metrics Report ===');
    this.logger.log(`Total event types: ${allMetrics.length}`);

    allMetrics
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach(metrics => {
        this.logger.log(
          `${metrics.eventType}: ${metrics.count} events, ` +
          `${metrics.averageProcessingTime.toFixed(2)}ms avg, ` +
          `${(metrics.errorRate * 100).toFixed(2)}% error rate`
        );
      });

    // Check for performance issues
    const slowEvents = allMetrics.filter(m => m.averageProcessingTime > 5000);
    if (slowEvents.length > 0) {
      this.logger.warn(`Slow events detected: ${slowEvents.map(e => e.eventType).join(', ')}`);
    }

    const highErrorEvents = allMetrics.filter(m => m.errorRate > 0.1);
    if (highErrorEvents.length > 0) {
      this.logger.warn(`High error rate events: ${highErrorEvents.map(e => e.eventType).join(', ')}`);
    }
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      totalEvents: number;
      averageProcessingTime: number;
      errorRate: number;
      activeEventTypes: number;
    };
    issues: string[];
  }> {
    const stats = await this.eventStore.getEventStats();
    const allMetrics = Array.from(this.eventMetrics.values());
    
    const totalProcessingTime = allMetrics.reduce((sum, m) => sum + m.averageProcessingTime, 0);
    const averageProcessingTime = allMetrics.length > 0 ? totalProcessingTime / allMetrics.length : 0;
    
    const totalErrors = allMetrics.reduce((sum, m) => sum + (m.count * m.errorRate), 0);
    const totalEventCount = allMetrics.reduce((sum, m) => sum + m.count, 0);
    const overallErrorRate = totalEventCount > 0 ? totalErrors / totalEventCount : 0;

    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (averageProcessingTime > 10000) {
      issues.push('High average processing time');
      status = 'warning';
    }

    if (overallErrorRate > 0.05) {
      issues.push('High error rate');
      status = overallErrorRate > 0.1 ? 'critical' : 'warning';
    }

    return {
      status,
      metrics: {
        totalEvents: stats.totalEvents,
        averageProcessingTime,
        errorRate: overallErrorRate,
        activeEventTypes: allMetrics.length
      },
      issues
    };
  }
}