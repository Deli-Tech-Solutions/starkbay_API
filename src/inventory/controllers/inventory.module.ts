import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryVariant } from './entities/inventory-variant.entity';
import { InventoryAdjustment } from './entities/inventory-adjustment.entity';
import { InventoryReservation } from './entities/inventory-reservation.entity';
import { InventoryService } from './services/inventory.service';
import { InventoryReservationService } from './services/inventory-reservation.service';
import { InventoryAlertService } from './services/inventory-alert.service';
import { InventoryReportService } from './services/inventory-report.service';
import { InventoryController } from './controllers/inventory.controller';
import { InventoryAdminController } from './controllers/inventory-admin.controller';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      InventoryVariant,
      InventoryAdjustment,
      InventoryReservation,
    ]),
    ProductsModule,
    UsersModule,
    MailModule,
    EventEmitterModule.forRoot(),
    OrdersModule,
  ],
  providers: [
    InventoryService,
    InventoryReservationService,
    InventoryAlertService,
    InventoryReportService,
  ],
  controllers: [InventoryController, InventoryAdminController],
  exports: [InventoryService, InventoryReservationService],
})
export class InventoryModule {}