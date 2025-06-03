import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationService } from './services/notification.service';
import { NotificationPreferenceService } from './services/notification-preference.service';
import { NotificationChannelService } from './services/notification-channel.service';
import { NotificationTemplateService } from './services/notification-template.service';
import { EmailService } from './services/channels/email.service';
import { InAppService } from './services/channels/in-app.service';
import { SmsService } from './services/channels/sms.service';
import { PushService } from './services/channels/push.service';
import { NotificationController } from './controllers/notification.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      NotificationTemplate,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationPreferenceService,
    NotificationChannelService,
    NotificationTemplateService,
    EmailService,
    InAppService,
    SmsService,
    PushService,
  ],
  exports: [
    NotificationService,
    NotificationPreferenceService,
    NotificationChannelService,
  ],
})
export class NotificationModule {}