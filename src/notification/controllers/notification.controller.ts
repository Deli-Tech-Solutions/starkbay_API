import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { NotificationPreferenceService } from '../services/notification-preference.service';
import { CreateNotificationDto, NotificationQueryDto, UpdateNotificationPreferenceDto } from '../dto/notification.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private preferenceService: NotificationPreferenceService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async findByUser(
    @CurrentUser('id') userId: string,
    @Query() query: NotificationQueryDto
  ) {
    return this.notificationService.findByUser(userId, query);
  }

  @Get('grouped')
  @ApiOperation({ summary: 'Get grouped notifications' })
  async getGrouped(@CurrentUser('id') userId: string) {
    return this.notificationService.getGroupedNotifications(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string
  ) {
    return this.notificationService.delete(id, userId);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@CurrentUser('id') userId: string) {
    return this.preferenceService.getUserPreferences(userId);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preference' })
  async updatePreference(
    @CurrentUser('id') userId: string,
    @Body() updateDto: UpdateNotificationPreferenceDto
  ) {
    return this.preferenceService.updatePreference(userId, updateDto);
  }
}
