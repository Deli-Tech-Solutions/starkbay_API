import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RefundService } from '../services/refund.service';
import { ReceiptService } from '../services/receipt.service';
import { CreateRefundDto } from '../dto/create-refund.dto';
import { Refund } from '../entities/refund.entity';

@Controller('refunds')
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Post()
  async createRefund(@Body() createRefundDto: CreateRefundDto): Promise<Refund> {
    return this.refundService.createRefund(createRefundDto);
  }

  @Get(':id')
  async getRefund(@Param('id') id: string): Promise<Refund> {
    return this.refundService.getRefund(id);
  }

  @Get(':id/receipt')
  async getRefundReceipt(@Param('id') id: string): Promise<any> {
    const refund = await this.refundService.getRefund(id);
    return this.receiptService.generateRefundReceipt(refund);
  }

  @Get('payment/:paymentId')
  async getRefundsByPayment(@Param('paymentId') paymentId: string): Promise<Refund[]> {
    return this.refundService.getRefundsByPayment(paymentId);
  }
}

// paymentSystem/payment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Refund } from './entities/refund.entity';
import { PaymentController } from './controllers/payment.controller';
import { PaymentMethodController } from './controllers/payment-method.controller';
import { RefundController } from './controllers/refund.controller';
import { PaymentService } from './services/payment.service';
import { PaymentMethodService } from './services/payment-method.service';
import { RefundService } from './services/refund.service';
import { PaymentProcessorService } from './services/payment-processor.service';
import { PaymentSecurityService } from './services/payment-security.service';
import { ReceiptService } from './services/receipt.service';
import { StripeProcessorService } from './processors/stripe-processor.service';
import { PaypalProcessorService } from './processors/paypal-processor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, PaymentMethod, Refund])
  ],
  controllers: [
    PaymentController,
    PaymentMethodController,
    RefundController
  ],
  providers: [
    PaymentService,
    PaymentMethodService,
    RefundService,
    PaymentProcessorService,
    PaymentSecurityService,
    ReceiptService,
    StripeProcessorService,
    PaypalProcessorService
  ],
  exports: [
    PaymentService,
    PaymentMethodService,
    RefundService,
    PaymentProcessorService
  ]
})
export class PaymentModule {}