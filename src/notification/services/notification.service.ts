import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationStatus } from '../entities/notification.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { CreateNotificationDto, NotificationQueryDto } from '../dto/notification.dto';
import { NotificationChannelService } from './notification-channel.service';
import { NotificationTemplateService } from './notification-template.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private channelService: NotificationChannelService,
    private templateService: NotificationTemplateService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const { userId, type, channel } = createNotificationDto;

    const preference = await this.preferenceRepository.findOne({
      where: { userId, type, channel }
    });

    if (preference && !preference.enabled) {
      throw new Error('User has disabled notifications for this type and channel');
    }

    let title = createNotificationDto.title;
    let content = createNotificationDto.content;

    if (createNotificationDto.templateId) {
      const rendered = await this.templateService.render(
        createNotificationDto.templateId,
        createNotificationDto.metadata || {}
      );
      title = rendered.subject;
      content = rendered.content;
    }

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      title,
      content,
    });

    const saved = await this.notificationRepository.save(notification);

    if (!createNotificationDto.scheduledAt) {
      await this.sendNotification(saved);
    }

    return saved;
  }

  async createBulk(notifications: CreateNotificationDto[]): Promise<Notification[]> {
    const results = [];
    for (const dto of notifications) {
      try {
        const notification = await this.create(dto);
        results.push(notification);
      } catch (error) {
        console.error(`Failed to create notification for user ${dto.userId}:`, error.message);
      }
    }
    return results;
  }

  async findByUser(userId: string, query: NotificationQueryDto): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    const { status, type, page = '1', limit = '20' } = query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where: any = { userId };
    if (status) where.status = status;
    if (type) where.type = type;

    const options: FindManyOptions<Notification> = {
      where,
      order: { createdAt: 'DESC' },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    };

    const [notifications, total] = await this.notificationRepository.findAndCount(options);

    const unreadCount = await this.notificationRepository.count({
      where: { userId, status: In([NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED]) }
    });

    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { 
        userId, 
        status: In([NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.DELIVERED])
      },
      { 
        status: NotificationStatus.READ,
        readAt: new Date()
      }
    );
  }

  async delete(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId
    });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getGroupedNotifications(userId: string): Promise<any[]> {
    const notifications = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.groupId IS NOT NULL')
      .orderBy('notification.createdAt', 'DESC')
      .getMany();

    const grouped = notifications.reduce((acc, notification) => {
      const groupId = notification.groupId;
      if (!acc[groupId]) {
        acc[groupId] = {
          groupId,
          type: notification.type,
          count: 0,
          latestNotification: notification,
          notifications: []
        };
      }
      acc[groupId].count++;
      acc[groupId].notifications.push(notification);
      if (notification.createdAt > acc[groupId].latestNotification.createdAt) {
        acc[groupId].latestNotification = notification;
      }
      return acc;
    }, {});

    return Object.values(grouped);
  }

  private async sendNotification(notification: Notification): Promise<void> {
    try {
      await this.channelService.send(notification);
      
      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);
    } catch (error) {
      notification.status = NotificationStatus.FAILED;
      notification.errorMessage = error.message;
      notification.retryCount++;
      await this.notificationRepository.save(notification);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    const scheduledNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.PENDING,
        scheduledAt: { $lte: new Date() } as any
      }
    });

    for (const notification of scheduledNotifications) {
      await this.sendNotification(notification);
    }
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = await this.notificationRepository.find({
      where: {
        status: NotificationStatus.FAILED,
        retryCount: { $lt: 3 } as any
      }
    });

    for (const notification of failedNotifications) {
      await this.sendNotification(notification);
    }
  }
}
