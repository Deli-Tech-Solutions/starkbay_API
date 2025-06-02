/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { SalesMetricsService } from '../sales/sales-metrics.service';
import { ProductMetricsService } from '../product-performance/product-metrics.service';
import { BehaviorService } from '../customer-behavior/behavior.service';

@Controller('analytics')
export class DashboardController {
  constructor(
    private readonly salesService: SalesMetricsService,
    private readonly productService: ProductMetricsService,
    private readonly behaviorService: BehaviorService,
  ) {}

  @Get('sales')
  getSales(@Query('from') from: string, @Query('to') to: string) {
    return this.salesService.getTotalSales(new Date(from), new Date(to));
  }

  @Get('product-performance')
  getProductViews(@Query('productId') productId: string) {
    return this.productService.getProductViews(productId);
  }

  @Get('customer-behavior')
  getCustomerBehavior(@Query('userId') userId: string) {
    return this.behaviorService.getUserBehavior(userId);
  }
}
