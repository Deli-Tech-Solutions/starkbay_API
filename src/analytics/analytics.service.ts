import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentAnalytics } from '../content/entities/content-analytics.entity';
import { Content } from '../content/entities/content.entity';

export interface AnalyticsEvent {
  contentId: string;
  eventType: string;
  eventData?: any;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  metadata?: any;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ContentAnalytics)
    private analyticsRepository: Repository<ContentAnalytics>,
    @InjectRepository(Content)
    private contentRepository: Repository<Content>,
  ) {}

  async trackEvent(event: AnalyticsEvent): Promise<ContentAnalytics> {
    const analytics = this.analyticsRepository.create(event);
    return this.analyticsRepository.save(analytics);
  }

  async getContentAnalytics(
    contentId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .where('analytics.contentId = :contentId', { contentId });

    if (startDate) {
      query.andWhere('analytics.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('analytics.createdAt <= :endDate', { endDate });
    }

    const events = await query.getMany();

    // Aggregate data
    const eventCounts = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    const uniqueUsers = new Set(
      events.filter((e) => e.userId).map((e) => e.userId),
    ).size;
    const uniqueSessions = new Set(
      events.filter((e) => e.sessionId).map((e) => e.sessionId),
    ).size;

    return {
      contentId,
      totalEvents: events.length,
      eventCounts,
      uniqueUsers,
      uniqueSessions,
      events: events.slice(0, 100), // Return latest 100 events
    };
  }

  async getTopContent(startDate?: Date, endDate?: Date, limit: number = 10) {
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.contentId')
      .addSelect('COUNT(*)', 'eventCount')
      .leftJoin('analytics.content', 'content')
      .addSelect('content.title')
      .addSelect('content.type')
      .groupBy('analytics.contentId, content.title, content.type')
      .orderBy('eventCount', 'DESC')
      .limit(limit);

    if (startDate) {
      query.andWhere('analytics.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('analytics.createdAt <= :endDate', { endDate });
    }

    return query.getRawMany();
  }

  async getEventTypeStats(startDate?: Date, endDate?: Date) {
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.eventType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('analytics.eventType')
      .orderBy('count', 'DESC');

    if (startDate) {
      query.andWhere('analytics.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('analytics.createdAt <= :endDate', { endDate });
    }

    return query.getRawMany();
  }

  async getDailyStats(startDate: Date, endDate: Date) {
    const query = this.analyticsRepository
      .createQueryBuilder('analytics')
      .select('DATE(analytics.createdAt)', 'date')
      .addSelect('COUNT(*)', 'eventCount')
      .addSelect('COUNT(DISTINCT analytics.userId)', 'uniqueUsers')
      .addSelect('COUNT(DISTINCT analytics.sessionId)', 'uniqueSessions')
      .where('analytics.createdAt >= :startDate', { startDate })
      .andWhere('analytics.createdAt <= :endDate', { endDate })
      .groupBy('DATE(analytics.createdAt)')
      .orderBy('date', 'ASC');

    return query.getRawMany();
  }

  async getContentPerformance(contentId: string) {
    const content = await this.contentRepository.findOne({
      where: { id: contentId },
      relations: ['analytics'],
    });

    if (!content) {
      throw new Error('Content not found');
    }

    const analytics = await this.getContentAnalytics(contentId);
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentAnalytics = await this.getContentAnalytics(
      contentId,
      last30Days,
    );

    return {
      content: {
        id: content.id,
        title: content.title,
        type: content.type,
        status: content.status,
        publishedAt: content.publishedAt,
        createdAt: content.createdAt,
      },
      allTime: analytics,
      last30Days: recentAnalytics,
    };
  }
}
