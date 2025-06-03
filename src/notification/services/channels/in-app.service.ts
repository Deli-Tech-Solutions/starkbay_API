import { Injectable } from '@nestjs/common';
import { Notification, NotificationStatus } from '../../entities/notification.entity';

@Injectable()
export class InAppService {
  async send(notification: Notification): Promise<void> {
    notification.status = NotificationStatus.DELIVERED;
  }
}
