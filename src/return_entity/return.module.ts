import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Return } from './entities/return.entity';
import { ReturnItem } from './entities/return-item.entity';
import { ReturnService } from './services/return.service';
import { RefundService } from './services/refund.service';
import { ReturnShippingService } from './services/return-shipping.service';
import { ReturnAnalyticsService } from './services/return-analytics.service';
import { ReturnController } from './controllers/return.controller';
import { ReturnAdminController } from './controllers/return-admin.controller';
import { OrdersModule } from '../orders/orders.module';
import { UsersModule } from '../users/users.module';
import { PaymentModule } from '../payment/payment.module';
import { ShippingModule } from '../shipping/shipping.module';
import { ReturnNotificationsService } from './services/return-notifications.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Return, ReturnItem]),
    OrdersModule,
    UsersModule,
    PaymentModule,
    ShippingModule,
    EventEmitterModule.forRoot(),
    MailModule,
  ],
  providers: [
    ReturnService,
    RefundService,
    ReturnShippingService,
    ReturnAnalyticsService,
    ReturnNotificationsService,
  ],
  controllers: [ReturnController, ReturnAdminController],
  exports: [ReturnService],
})
export class ReturnModule {}