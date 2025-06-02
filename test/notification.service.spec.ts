import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from '../src/services/notification.service';
import { Notification, NotificationType, NotificationChannel, NotificationStatus } from '../src/entities/notification.entity';
import { NotificationPreference } from '../src/entities/notification-preference.entity';
import { NotificationChannelService } from '../src/services/notification-channel.service';
import { NotificationTemplateService } from '../src/services/notification-template.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Repository<Notification>;
  let preferenceRepository: Repository<NotificationPreference>;
  let channelService: NotificationChannelService;
  let templateService: NotificationTemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(NotificationPreference),
          useClass: Repository,
        },
        {
          provide: NotificationChannelService,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: NotificationTemplateService,
          useValue: {
            render: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    preferenceRepository = module.get<Repository<NotificationPreference>>(getRepositoryToken(NotificationPreference));
    channelService = module.get<NotificationChannelService>(NotificationChannelService);
    templateService = module.get<NotificationTemplateService>(NotificationTemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      const createDto = {
        userId: 'user-1',
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.EMAIL,
        title: 'Test Notification',
        content: 'Test content',
      };

      const mockNotification = { id: 'notification-1', ...createDto };

      jest.spyOn(preferenceRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(notificationRepository, 'create').mockReturnValue(mockNotification as any);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue(mockNotification as any);
      jest.spyOn(channelService, 'send').mockResolvedValue();

      const result = await service.create(createDto);

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.create).toHaveBeenCalledWith(createDto);
      expect(notificationRepository.save).toHaveBeenCalledWith(mockNotification);
    });

    it('should throw error when user disabled notifications', async () => {
      const createDto = {
        userId: 'user-1',
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.EMAIL,
        title: 'Test Notification',
        content: 'Test content',
      };

      const mockPreference = { enabled: false };

      jest.spyOn(preferenceRepository, 'findOne').mockResolvedValue(mockPreference as any);

      await expect(service.create(createDto)).rejects.toThrow('User has disabled notifications for this type and channel');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notification-1';
      const userId = 'user-1';
      const mockNotification = {
        id: notificationId,
        userId,
        status: NotificationStatus.SENT,
        readAt: null,
      };

      jest.spyOn(notificationRepository, 'findOne').mockResolvedValue(mockNotification as any);
      jest.spyOn(notificationRepository, 'save').mockResolvedValue({
        ...mockNotification,
        status: NotificationStatus.READ,
        readAt: expect.any(Date),
      } as any);

      const result = await service.markAsRead(notificationId, userId);

      expect(result.status).toBe(NotificationStatus.READ);
      expect(result.readAt).toBeDefined();
    });
  });
});