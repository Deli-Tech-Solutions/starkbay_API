import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly retentionDays: number;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    private readonly configService: ConfigService,
  ) {
    this.retentionDays = this.configService.get<number>('AUDIT_LOG_RETENTION_DAYS', 90);
  }

  async logChange(params: {
    entityType: string;
    entityId: string;
    action: string;
    userId: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    userIp?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create(params);
    return this.auditLogRepository.save(auditLog);
  }

  async queryLogs(params: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const { page = 1, limit = 10, ...filters } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    if (filters.entityType) {
      queryBuilder.andWhere('audit_log.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('audit_log.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.userId) {
      queryBuilder.andWhere('audit_log.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit_log.action = :action', { action: filters.action });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere({
        timestamp: Between(filters.startDate, filters.endDate),
      });
    }

    const [logs, total] = await queryBuilder
      .orderBy('audit_log.timestamp', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { logs, total };
  }

  async exportLogs(params: {
    startDate: Date;
    endDate: Date;
    format: 'csv' | 'json';
  }): Promise<string> {
    const logs = await this.auditLogRepository.find({
      where: {
        timestamp: Between(params.startDate, params.endDate),
      },
      order: {
        timestamp: 'ASC',
      },
    });

    if (params.format === 'csv') {
      return this.convertToCSV(logs);
    }
    return JSON.stringify(logs, null, 2);
  }

  private convertToCSV(logs: AuditLog[]): string {
    const headers = ['ID', 'Entity Type', 'Entity ID', 'Action', 'User ID', 'Timestamp', 'Before State', 'After State'];
    const rows = logs.map(log => [
      log.id,
      log.entityType,
      log.entityId,
      log.action,
      log.userId,
      log.timestamp.toISOString(),
      JSON.stringify(log.beforeState),
      JSON.stringify(log.afterState),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldLogs(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const result = await this.auditLogRepository.delete({
      timestamp: LessThan(cutoffDate),
    });

    this.logger.log(`Cleaned up ${result.affected} old audit logs`);
  }

  async getSuspiciousActivity(params: {
    startDate: Date;
    endDate: Date;
    threshold: number;
  }): Promise<AuditLog[]> {
    const { startDate, endDate, threshold } = params;

    // Example of suspicious activity detection: multiple failed login attempts
    const suspiciousLogs = await this.auditLogRepository
      .createQueryBuilder('audit_log')
      .select('audit_log.userId')
      .addSelect('COUNT(*)', 'count')
      .where('audit_log.action = :action', { action: 'LOGIN_FAILED' })
      .andWhere('audit_log.timestamp BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('audit_log.userId')
      .having('COUNT(*) >= :threshold', { threshold })
      .getRawMany();

    return suspiciousLogs;
  }
} 