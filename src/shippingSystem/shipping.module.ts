import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shipping } from './entities/shipping.entity';
import { ShippingZone } from './entities/shipping-zone.entity';
import { ShippingMethod } from './entities/shipping-method.entity';
import { ShippingRate } from './entities/shipping-rate.entity';
import { TrackingEvent } from './entities/tracking-event.entity';
import { Order } from './entities/order.entity';
import { ShippingController } from './controllers/shipping.controller';
import { ShippingZoneController } from './controllers/shipping-zone.controller';
import { ShippingService } from './services/shipping.service';
import { ShippingZoneService } from './services/shipping-zone.service';
import { ShippingCalculatorService } from './services/shipping-calculator.service';
import { TrackingService } from './services/tracking.service';
import { DeliveryEstimationService } from './services/delivery-estimation.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipping,
      ShippingZone,
      ShippingMethod,
      ShippingRate,
      TrackingEvent,
      Order,
    ]),
  ],
  controllers: [
    ShippingController,
    ShippingZoneController,
  ],
  providers: [
    ShippingService,
    ShippingZoneService,
    ShippingCalculatorService,
    TrackingService,
    DeliveryEstimationService,
    NotificationService,
  ],
  exports: [
    ShippingService,
    ShippingCalculatorService,
    TrackingService,
    DeliveryEstimationService,
    NotificationService,
  ],
})
export class ShippingModule {}
