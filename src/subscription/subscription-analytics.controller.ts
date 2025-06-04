import { Controller, Get } from '@nestjs/common';
import { SubscriptionAnalyticsService } from './subscription-analytics.service';

@Controller('subscriptions/analytics')
export class SubscriptionAnalyticsController {
  constructor(private readonly analyticsService: SubscriptionAnalyticsService) {}

  @Get('stats')
  getStats() {
    return this.analyticsService.getSubscriptionStats();
  }
}
