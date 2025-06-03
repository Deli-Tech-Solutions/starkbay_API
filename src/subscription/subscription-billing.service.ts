import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionBillingService {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // This cron job runs every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async processRecurringPayments() {
    const dueSubscriptions = await this.subscriptionService.processDueSubscriptions();
    // Here you would loop through dueSubscriptions and process payments
    // For now, just log the count
    console.log(`Processing ${dueSubscriptions.length} due subscriptions for billing.`);
  }
}
