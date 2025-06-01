import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseUUIDPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';
import { OrderStatus } from './entities/order.entity';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  @Get()
  async findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: OrderStatus
  ) {
    return this.orderService.findAll(customerId, status);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ) {
    // In a real app, you'd get the changedBy from the JWT token
    return this.orderService.updateStatus(id, updateOrderStatusDto, 'admin');
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelOrderDto: CancelOrderDto
  ) {
    // In a real app, you'd get the cancelledBy from the JWT token
    return this.orderService.cancelOrder(id, cancelOrderDto, 'customer');
  }

  @Get(':id/tracking')
  async getTracking(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.getOrderTracking(id);
  }

  @Get('customer/:customerId/history')
  async getOrderHistory(
    @Param('customerId') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.orderService.getOrderHistory(customerId, page, limit);
  }
}