import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Subscription } from './subscription.entity';

@Injectable()
export class SubscriptionAnalyticsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async getSubscriptionStats() {
    const total = await this.subscriptionRepository.count();
    const active = await this.subscriptionRepository.count({ where: { status: 'active' } });
    const paused = await this.subscriptionRepository.count({ where: { status: 'paused' } });
    const cancelled = await this.subscriptionRepository.count({ where: { status: 'cancelled' } });
    // Churn rate, MRR, etc. can be added here
    return { total, active, paused, cancelled };
  }

  async getMonthlyNewSubscriptions(year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return this.subscriptionRepository.count({
      where: { startDate: Between(start, end) },
    });
  }
}
