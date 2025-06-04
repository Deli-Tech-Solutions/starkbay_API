import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Injectable()
export class PaymentCleanupTask {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredPayments(): Promise<void> {
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() - 24); // 24 hours ago

    const expiredPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: LessThan(expiredDate)
      }
    });

    for (const payment of expiredPayments) {
      payment.status = PaymentStatus.CANCELLED;
      await this.paymentRepository.save(payment);
    }

    console.log(`Cleaned up ${expiredPayments.length} expired payments`);
  }

  @Cron(CronExpression.EVERY_WEEK)
  async generatePaymentReport(): Promise<void> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyStats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select([
        'COUNT(*) as total_payments',
        'SUM(CASE WHEN status = :success THEN amount ELSE 0 END) as successful_amount',
        'COUNT(CASE WHEN status = :success THEN 1 END) as successful_count',
        'COUNT(CASE WHEN status = :failed THEN 1 END) as failed_count'
      ])
      .where('payment.createdAt >= :weekAgo', { weekAgo })
      .setParameters({
        success: PaymentStatus.SUCCESS,
        failed: PaymentStatus.FAILED
      })
      .getRawOne();

    console.log('Weekly Payment Report:', weeklyStats);
  }
}