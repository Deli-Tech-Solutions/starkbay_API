import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { UpdateNotificationPreferenceDto } from '../dto/notification.dto';
import { NotificationChannel, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
  ) {}

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { userId }
    });
  }

  async updatePreference(
    userId: string,
    updateDto: UpdateNotificationPreferenceDto
  ): Promise<NotificationPreference> {
    const { type, channel, enabled, settings } = updateDto;

    let preference = await this.preferenceRepository.findOne({
      where: { userId, type, channel }
    });

    if (!preference) {
      preference = this.preferenceRepository.create({
        userId,
        type,
        channel,
        enabled,
        settings
      });
    } else {
      preference.enabled = enabled;
      preference.settings = settings;
    }

    return this.preferenceRepository.save(preference);
  }

  async getDefaultPreferences(): Promise<NotificationPreference[]> {
    const defaults: NotificationPreference[] = [];
    
    for (const type of Object.values(NotificationType)) {
      for (const channel of Object.values(NotificationChannel)) {
        defaults.push({
          type: type as NotificationType,
          channel: channel as NotificationChannel,
          enabled: true,
          settings: {}
        } as NotificationPreference);
      }
    }
    
    return defaults;
  }

  async initializeUserPreferences(userId: string): Promise<void> {
    const existing = await this.preferenceRepository.count({
      where: { userId }
    });

    if (existing === 0) {
      const defaults = await this.getDefaultPreferences();
      const preferences = defaults.map(pref => 
        this.preferenceRepository.create({ ...pref, userId })
      );
      await this.preferenceRepository.save(preferences);
    }
  }
}
