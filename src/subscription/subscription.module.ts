import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionAnalyticsService } from './subscription-analytics.service';
import { SubscriptionAnalyticsController } from './subscription-analytics.controller';
import { SubscriptionBillingService } from './subscription-billing.service';
import { SubscriptionNotificationService } from './subscription-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription])],
  providers: [SubscriptionService, SubscriptionAnalyticsService, SubscriptionBillingService, SubscriptionNotificationService],
  controllers: [SubscriptionController, SubscriptionAnalyticsController],
  exports: [SubscriptionService, SubscriptionAnalyticsService, SubscriptionBillingService, SubscriptionNotificationService],
})
export class SubscriptionModule {}
