import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { PaymentMethodService } from '../services/payment-method.service';
import { CreatePaymentMethodDto } from '../dto/create-payment-method.dto';
import { PaymentMethod } from '../entities/payment-method.entity';

@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly paymentMethodService: PaymentMethodService) {}

  @Post()
  async create(@Body() createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    return this.paymentMethodService.create(createPaymentMethodDto);
  }

  @Get()
  async findAll(): Promise<PaymentMethod[]> {
    return this.paymentMethodService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PaymentMethod> {
    return this.paymentMethodService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateData: Partial<PaymentMethod>): Promise<PaymentMethod> {
    return this.paymentMethodService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.paymentMethodService.remove(id);
  }
}