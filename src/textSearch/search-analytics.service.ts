import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchAnalytics } from './entities/search-analytics.entity';
import { SearchAnalyticsData } from './interfaces/search.interface';

@Injectable()
export class SearchAnalyticsService {
  constructor(
    @InjectRepository(SearchAnalytics)
    private analyticsRepository: Repository<SearchAnalytics>
  ) {}

  async logSearch(data: SearchAnalyticsData): Promise<void> {
    const analytics = this.analyticsRepository.create({
      query: data.query,
      results_count: data.results_count,
      response_time: data.response_time,
      filters_applied: data.filters_applied,
      user_ip: data.user_ip,
      user_agent: data.user_agent
    });

    await this.analyticsRepository.save(analytics);
  }

  async getAnalytics(days: number = 30, limit: number = 100) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.query',
        'COUNT(*) as search_count',
        'AVG(analytics.results_count) as avg_results',
        'AVG(analytics.response_time) as avg_response_time'
      ])
      .where('analytics.searched_at >= :startDate', { startDate })
      .groupBy('analytics.query')
      .orderBy('search_count', 'DESC')
      .limit(limit)
      .getRawMany();

    return {
      period_days: days,
      total_queries: analytics.length,
      analytics: analytics.map(a => ({
        query: a.analytics_query,
        search_count: parseInt(a.search_count),
        avg_results: parseFloat(a.avg_results),
        avg_response_time: parseFloat(a.avg_response_time)
      }))
    };
  }

  async getTrendingQueries(limit: number = 10) {
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const trending = await this.analyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.query',
        'COUNT(*) as search_count',
        'AVG(analytics.results_count) as avg_results'
      ])
      .where('analytics.searched_at >= :last24Hours', { last24Hours })
      .groupBy('analytics.query')
      .having('COUNT(*) > 1')
      .orderBy('search_count', 'DESC')
      .limit(limit)
      .getRawMany();

    return trending.map(t => ({
      query: t.analytics_query,
      search_count: parseInt(t.search_count),
      avg_results: parseFloat(t.avg_results)
    }));
  }

  async getSearchStats() {
    const totalSearches = await this.analyticsRepository.count();
    const uniqueQueries = await this.analyticsRepository
      .createQueryBuilder()
      .select('COUNT(DISTINCT query)')
      .getRawOne();

    const avgResponseTime = await this.analyticsRepository
      .createQueryBuilder()
      .select('AVG(response_time)')
      .getRawOne();

    return {
      total_searches: totalSearches,
      unique_queries: parseInt(uniqueQueries.count),
      avg_response_time: parseFloat(avgResponseTime.avg)
    };
  }
}