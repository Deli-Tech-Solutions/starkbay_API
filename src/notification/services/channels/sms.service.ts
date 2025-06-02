import { Injectable } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class SmsService {
  async send(notification: Notification): Promise<void> {
    console.log(`SMS sent to ${notification.user.phone}: ${notification.content}`);
  }
}
