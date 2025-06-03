import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './entities/system-config.entity';
import { AdminLog } from './entities/admin-log.entity';
import { User } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(SystemConfig)
    private readonly systemConfigRepository: Repository<SystemConfig>,
    @InjectRepository(AdminLog)
    private readonly adminLogRepository: Repository<AdminLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  // System Configuration Methods
  async getSystemConfig(key: string): Promise<SystemConfig> {
    const config = await this.systemConfigRepository.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`System configuration '${key}' not found`);
    }
    return config;
  }

  async updateSystemConfig(
    key: string,
    value: any,
    adminId: string,
    metadata?: Record<string, any>,
  ): Promise<SystemConfig> {
    const config = await this.systemConfigRepository.findOne({ where: { key } });
    if (!config) {
      throw new NotFoundException(`System configuration '${key}' not found`);
    }

    config.value = value;
    config.updatedBy = adminId;
    await this.systemConfigRepository.save(config);

    await this.logAdminAction(adminId, 'UPDATE_SYSTEM_CONFIG', {
      key,
      oldValue: config.value,
      newValue: value,
    }, metadata);

    return config;
  }

  // User Management Methods
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async updateUser(
    id: string,
    updateData: Partial<User>,
    adminId: string,
    metadata?: Record<string, any>,
  ): Promise<User> {
    const user = await this.getUserById(id);
    const oldData = { ...user };

    Object.assign(user, updateData);
    await this.userRepository.save(user);

    await this.logAdminAction(adminId, 'UPDATE_USER', {
      userId: id,
      oldData,
      newData: updateData,
    }, metadata);

    return user;
  }

  async deactivateUser(
    id: string,
    adminId: string,
    metadata?: Record<string, any>,
  ): Promise<User> {
    const user = await this.getUserById(id);
    user.isActive = false;
    await this.userRepository.save(user);

    await this.logAdminAction(adminId, 'DEACTIVATE_USER', {
      userId: id,
    }, metadata);

    return user;
  }

  // Admin Logging Methods
  async logAdminAction(
    adminId: string,
    action: string,
    details: Record<string, any>,
    metadata?: Record<string, any>,
  ): Promise<AdminLog> {
    const log = this.adminLogRepository.create({
      adminId,
      action,
      details,
      metadata,
    });
    return this.adminLogRepository.save(log);
  }

  async getAdminLogs(params: {
    adminId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AdminLog[]; total: number }> {
    const { page = 1, limit = 10, ...filters } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.adminLogRepository.createQueryBuilder('admin_log');

    if (filters.adminId) {
      queryBuilder.andWhere('admin_log.adminId = :adminId', { adminId: filters.adminId });
    }

    if (filters.action) {
      queryBuilder.andWhere('admin_log.action = :action', { action: filters.action });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('admin_log.timestamp BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const [logs, total] = await queryBuilder
      .orderBy('admin_log.timestamp', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }
} 