import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, Like } from 'typeorm';
import { TransactionLog } from '../entities/transaction-log.entity';
import { TransactionStatus } from 'src/common/types/transaction.types';

@Injectable()
export class TransactionLogRepository {
  constructor(
    @InjectRepository(TransactionLog)
    private readonly repository: Repository<TransactionLog>,
  ) {}

  async create(logData: Partial<TransactionLog>): Promise<TransactionLog> {
    const log = this.repository.create(logData);
    return this.repository.save(log);
  }

  async findByTransactionId(transactionId: string): Promise<TransactionLog[]> {
    return this.repository.find({
      where: { transactionId },
      order: { timestamp: 'ASC' },
    });
  }

  async findFailedTransactions(
    startDate: Date,
    endDate: Date,
  ): Promise<TransactionLog[]> {
    return this.repository.find({
      where: {
        status: TransactionStatus.FAILED,
        timestamp: Between(startDate, endDate),
      },
      order: { timestamp: 'DESC' },
    });
  }

  async getTransactionStats(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    successful: number;
    failed: number;
    avgDuration: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('log')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = :success THEN 1 ELSE 0 END) as successful',
        'SUM(CASE WHEN status = :failed THEN 1 ELSE 0 END) as failed',
        'AVG(duration) as avgDuration',
      ])
      .where('timestamp BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
        success: TransactionStatus.COMMITTED,
        failed: TransactionStatus.FAILED,
      })
      .getRawOne<{
        total: string;
        successful: string;
        failed: string;
        avgDuration: string;
      }>();

    return {
      total: result ? parseInt(result.total, 10) : 0,
      successful: result ? parseInt(result.successful, 10) : 0,
      failed: result ? parseInt(result.failed, 10) : 0,
      avgDuration: result ? parseFloat(result.avgDuration) || 0 : 0,
    };
  }

  async findDeadlockedTransactions(
    timeWindow: number = 5000,
  ): Promise<TransactionLog[]> {
    const cutoffTime = new Date(Date.now() - timeWindow);

    return this.repository.find({
      where: {
        error: Like('%deadlock%'),
        timestamp: MoreThanOrEqual(cutoffTime),
      },
      // Use raw query for deadlock detection
    });
  }
}
