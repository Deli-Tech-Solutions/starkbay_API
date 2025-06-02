import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from '../entities/return.entity';
import { ReturnReason } from '../enums/return-reason.enum';
import { ReturnAnalytics } from '../interfaces/return-analytics.interface';

@Injectable()
export class ReturnAnalyticsService {
  constructor(
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
  ) {}

  async getReturnStats(timePeriod: '7d' | '30d' | '90d' | '1y'): Promise<ReturnAnalytics> {
    const date = new Date();
    switch (timePeriod) {
      case '7d':
        date.setDate(date.getDate() - 7);
        break;
      case '30d':
        date.setDate(date.getDate() - 30);
        break;
      case '90d':
        date.setDate(date.getDate() - 90);
        break;
      case '1y':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }

    const returns = await this.returnRepository.find({
      where: {
        createdAt: { $gte: date },
      },
    });

    const totalReturns = returns.length;
    const totalRefundAmount = returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
    
    const reasons = returns.reduce((acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + 1;
      return acc;
    }, {} as Record<ReturnReason, number>);

    const statuses = returns.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalReturns,
      totalRefundAmount,
      reasons,
      statuses,
      timePeriod,
    };
  }

  async getProductReturnRates(): Promise<Array<{ productId: string, returnRate: number }>> {
    // This would require a more complex query joining with order items
    // Implementation depends on your product structure
    return [];
  }
}