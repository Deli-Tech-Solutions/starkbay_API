import { Injectable } from '@nestjs/common';
import { NotificationService } from '../notification/services/notification.service';
import { NotificationType, NotificationChannel } from '../notification/entities/notification.entity';

@Injectable()
export class SubscriptionNotificationService {
  constructor(private readonly notificationService: NotificationService) {}

  async sendRenewalReminder(userId: string, subscriptionId: string) {
    await this.notificationService.create({
      userId,
      type: NotificationType.REMINDER,
      channel: NotificationChannel.EMAIL,
      title: 'Subscription Renewal Reminder',
      content: `Your subscription ${subscriptionId} will renew soon.`,
    });
  }

  async sendPaymentFailed(userId: string, subscriptionId: string) {
    await this.notificationService.create({
      userId,
      type: NotificationType.REMINDER,
      channel: NotificationChannel.EMAIL,
      title: 'Payment Failed',
      content: `Payment for subscription ${subscriptionId} failed. Please update your payment method.`,
    });
  }
}
