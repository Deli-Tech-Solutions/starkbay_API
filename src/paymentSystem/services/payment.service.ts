import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PaymentProcessorService } from './payment-processor.service';
import { PaymentSecurityService } from './payment-security.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private paymentProcessorService: PaymentProcessorService,
    private paymentSecurityService: PaymentSecurityService,
  ) {}

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createPaymentDto.paymentMethodId, isActive: true }
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found or inactive');
    }

    // Security validation
    await this.paymentSecurityService.validatePayment(createPaymentDto);

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      paymentMethod,
      status: PaymentStatus.PENDING
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Process payment asynchronously
    this.processPaymentAsync(savedPayment);

    return savedPayment;
  }

  private async processPaymentAsync(payment: Payment): Promise<void> {
    try {
      payment.status = PaymentStatus.PROCESSING;
      await this.paymentRepository.save(payment);

      const result = await this.paymentProcessorService.processPayment(payment);
      
      payment.status = PaymentStatus.SUCCESS;
      payment.transactionId = result.transactionId;
      payment.metadata = { ...payment.metadata, processorResponse: result.processorResponse };
      
      await this.paymentRepository.save(payment);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = { ...payment.metadata, error: error.message };
      await this.paymentRepository.save(payment);
    }
  }

  async getPayment(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['paymentMethod', 'refunds']
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async getPaymentHistory(customerId: string, page: number = 1, limit: number = 10): Promise<{ payments: Payment[], total: number }> {
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { customerId },
      relations: ['paymentMethod'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return { payments, total };
  }

  async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Payment> {
    const payment = await this.getPayment(id);
    payment.status = status;
    return this.paymentRepository.save(payment);
  }
}
