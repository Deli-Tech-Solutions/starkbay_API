import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { ReceiptService } from '../services/receipt.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { Payment, PaymentStatus } from '../entities/payment.entity';

@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Post()
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentService.createPayment(createPaymentDto);
  }

  @Get(':id')
  async getPayment(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.getPayment(id);
  }

  @Get(':id/receipt')
  async getPaymentReceipt(@Param('id') id: string): Promise<any> {
    const payment = await this.paymentService.getPayment(id);
    return this.receiptService.generatePaymentReceipt(payment);
  }

  @Get('customer/:customerId/history')
  async getPaymentHistory(
    @Param('customerId') customerId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ payments: Payment[], total: number }> {
    return this.paymentService.getPaymentHistory(customerId, page, limit);
  }

  @Post(':id/status')
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: PaymentStatus,
  ): Promise<Payment> {
    return this.paymentService.updatePaymentStatus(id, status);
  }
}
