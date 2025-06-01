/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './events/event.entity';
import { EventService } from './events/event.service';
import { SalesMetricsService } from './sales/sales-metrics.service';
import { ProductMetricsService } from './product-performance/product-metrics.service';
import { BehaviorService } from './customer-behavior/behavior.service';
import { DashboardController } from './dashboard/dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [
    EventService,
    SalesMetricsService,
    ProductMetricsService,
    BehaviorService,
  ],
  controllers: [DashboardController],
})
export class AnalyticsModule {}
