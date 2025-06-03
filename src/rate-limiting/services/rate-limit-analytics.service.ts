import { Injectable } from '@nestjs/common';
import { RateLimitAnalytics } from '../interfaces/rate-limit.interface';

@Injectable()
export class RateLimitAnalyticsService {
  private analytics: RateLimitAnalytics[] = [];

  recordRequest(analytics: RateLimitAnalytics): void {
    this.analytics.push({
      ...analytics,
      timestamp: new Date()
    });

    if (this.analytics.length > 10000) {
      this.analytics = this.analytics.slice(-5000);
    }
  }

  getAnalytics(startDate?: Date, endDate?: Date): RateLimitAnalytics[] {
    let filtered = this.analytics;

    if (startDate) {
      filtered = filtered.filter(a => a.timestamp >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(a => a.timestamp <= endDate);
    }

    return filtered;
  }

  getRateLimitedRequests(hours: number = 24): RateLimitAnalytics[] {
    const since = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.analytics.filter(a => 
      a.rateLimited && a.timestamp >= since
    );
  }

  getTopRateLimitedIPs(limit: number = 10): Array<{ip: string, count: number}> {
    const rateLimited = this.getRateLimitedRequests();
    const ipCounts = rateLimited.reduce((acc, curr) => {
      acc[curr.ip] = (acc[curr.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getEndpointStats(): Array<{
    endpoint: string;
    totalRequests: number;
    rateLimitedRequests: number;
    rateLimitedPercentage: number;
  }> {
    const endpointStats = this.analytics.reduce((acc, curr) => {
      if (!acc[curr.endpoint]) {
        acc[curr.endpoint] = { total: 0, rateLimited: 0 };
      }
      acc[curr.endpoint].total++;
      if (curr.rateLimited) {
        acc[curr.endpoint].rateLimited++;
      }
      return acc;
    }, {} as Record<string, { total: number; rateLimited: number }>);

    return Object.entries(endpointStats).map(([endpoint, stats]) => ({
      endpoint,
      totalRequests: stats.total,
      rateLimitedRequests: stats.rateLimited,
      rateLimitedPercentage: (stats.rateLimited / stats.total) * 100
    }));
  }
}
