import { Injectable } from '@nestjs/common';
import { Notification, NotificationChannel } from '../entities/notification.entity';
import { EmailService } from './email.service';
import { InAppService } from './in-app.service';
import { SmsService } from './channels/sms.service';
import { PushService } from './push.service';

@Injectable()
export class NotificationChannelService {
  constructor(
    private emailService: EmailService,
    private inAppService: InAppService,
    private smsService: SmsService,
    private pushService: PushService,
  ) {}

  async send(notification: Notification): Promise<void> {
    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        await this.emailService.send(notification);
        break;
      case NotificationChannel.IN_APP:
        await this.inAppService.send(notification);
        break;
      case NotificationChannel.SMS:
        await this.smsService.send(notification);
        break;
      case NotificationChannel.PUSH:
        await this.pushService.send(notification);
        break;
      default:
        throw new Error(`Unsupported notification channel: ${notification.channel}`);
    }
  }
}
