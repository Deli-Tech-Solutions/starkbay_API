import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, BillingCycle } from './subscription.entity';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async create(createDto: CreateSubscriptionDto): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create({
      ...createDto,
      status: 'active',
      isPaused: false,
      nextBillingDate: this.calculateNextBillingDate(new Date(createDto.startDate), createDto.billingCycle),
    });
    return this.subscriptionRepository.save(subscription);
  }

  async update(id: string, updateDto: UpdateSubscriptionDto): Promise<Subscription | null> {
    await this.subscriptionRepository.update(id, updateDto);
    return this.subscriptionRepository.findOne({ where: { id } });
  }

  async findById(id: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({ where: { id } });
  }

  async pause(id: string): Promise<Subscription | null> {
    await this.subscriptionRepository.update(id, { isPaused: true, status: 'paused' });
    return this.findById(id);
  }

  async resume(id: string): Promise<Subscription | null> {
    const subscription = await this.findById(id);
    if (!subscription) return null;
    const nextBillingDate = this.calculateNextBillingDate(new Date(), subscription.billingCycle);
    await this.subscriptionRepository.update(id, { isPaused: false, status: 'active', nextBillingDate });
    return this.findById(id);
  }

  async processDueSubscriptions() {
    const today = new Date();
    const dueSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: 'active',
        isPaused: false,
        nextBillingDate: today,
      },
    });
    // Here you would process payments for each due subscription
    // For now, just return the due subscriptions
    return dueSubscriptions;
  }

  calculateNextBillingDate(from: Date, billingCycle: BillingCycle): Date {
    const next = new Date(from);
    switch (billingCycle) {
      case BillingCycle.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case BillingCycle.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        break;
      case BillingCycle.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}
