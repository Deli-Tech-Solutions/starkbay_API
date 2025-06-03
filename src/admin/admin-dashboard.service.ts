import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AdminLog } from './entities/admin-log.entity';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AdminLog)
    private readonly adminLogRepository: Repository<AdminLog>,
  ) {}

  async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    recentAdminActions: number;
    systemHealth: {
      status: string;
      lastCheck: Date;
    };
  }> {
    const [totalUsers, activeUsers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
    ]);

    const recentAdminActions = await this.adminLogRepository.count({
      where: {
        timestamp: Between(
          new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          new Date(),
        ),
      },
    });

    return {
      totalUsers,
      activeUsers,
      recentAdminActions,
      systemHealth: {
        status: 'healthy',
        lastCheck: new Date(),
      },
    };
  }

  async getRecentAdminActions(limit: number = 10): Promise<AdminLog[]> {
    return this.adminLogRepository.find({
      order: {
        timestamp: 'DESC',
      },
      take: limit,
    });
  }

  async getUserActivityStats(days: number = 7): Promise<{
    date: string;
    activeUsers: number;
    newUsers: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.userRepository
      .createQueryBuilder('user')
      .select('DATE(user.createdAt)', 'date')
      .addSelect('COUNT(DISTINCT CASE WHEN user.isActive THEN user.id END)', 'activeUsers')
      .addSelect('COUNT(DISTINCT user.id)', 'newUsers')
      .where('user.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats;
  }

  async getAdminActivityStats(days: number = 7): Promise<{
    date: string;
    actionCount: number;
    uniqueAdmins: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.adminLogRepository
      .createQueryBuilder('admin_log')
      .select('DATE(admin_log.timestamp)', 'date')
      .addSelect('COUNT(*)', 'actionCount')
      .addSelect('COUNT(DISTINCT admin_log.adminId)', 'uniqueAdmins')
      .where('admin_log.timestamp >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats;
  }
} 