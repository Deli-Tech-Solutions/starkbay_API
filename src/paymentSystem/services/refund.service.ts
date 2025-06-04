import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund, RefundStatus } from '../entities/refund.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { PaymentProcessorService } from './payment-processor.service';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private paymentProcessorService: PaymentProcessorService,
  ) {}

  async createRefund(createRefundDto: CreateRefundDto): Promise<Refund> {
    const payment = await this.paymentRepository.findOne({
      where: { id: createRefundDto.paymentId },
      relations: ['refunds', 'paymentMethod']
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException('Can only refund successful payments');
    }

    const totalRefunded = payment.refunds
      .filter(r => r.status === RefundStatus.SUCCESS)
      .reduce((sum, r) => sum + Number(r.amount), 0);

    if (totalRefunded + createRefundDto.amount > Number(payment.amount)) {
      throw new BadRequestException('Refund amount exceeds payment amount');
    }

    const refund = this.refundRepository.create({
      ...createRefundDto,
      payment,
      status: RefundStatus.PENDING
    });

    const savedRefund = await this.refundRepository.save(refund);

    // Process refund asynchronously
    this.processRefundAsync(savedRefund);

    return savedRefund;
  }

  private async processRefundAsync(refund: Refund): Promise<void> {
    try {
      refund.status = RefundStatus.PROCESSING;
      await this.refundRepository.save(refund);

      const result = await this.paymentProcessorService.processRefund(refund);
      
      refund.status = RefundStatus.SUCCESS;
      refund.refundTransactionId = result.refundId;
      
      await this.refundRepository.save(refund);

      // Update payment status if fully refunded
      const payment = await this.paymentRepository.findOne({
        where: { id: refund.payment.id },
        relations: ['refunds']
      });

      const totalRefunded = payment.refunds
        .filter(r => r.status === RefundStatus.SUCCESS)
        .reduce((sum, r) => sum + Number(r.amount), 0);

      if (totalRefunded >= Number(payment.amount)) {
        payment.status = PaymentStatus.REFUNDED;
        await this.paymentRepository.save(payment);
      }
    } catch (error) {
      refund.status = RefundStatus.FAILED;
      await this.refundRepository.save(refund);
    }
  }

  async getRefund(id: string): Promise<Refund> {
    const refund = await this.refundRepository.findOne({
      where: { id },
      relations: ['payment']
    });

    if (!refund) {
      throw new NotFoundException('Refund not found');
    }

    return refund;
  }

  async getRefundsByPayment(paymentId: string): Promise<Refund[]> {
    return this.refundRepository.find({
      where: { payment: { id: paymentId } },
      order: { createdAt: 'DESC' }
    });
  }
}
