import { Injectable } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class PushService {
  async send(notification: Notification): Promise<void> {
    console.log(`Push notification sent: ${notification.title}`);
  }
}
