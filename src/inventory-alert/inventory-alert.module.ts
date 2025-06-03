import { Module } from '@nestjs/common';
import { InventoryAlertService } from './inventory-alert.service';
import { InventoryAlertController } from './inventory-alert.controller';

@Module({
  controllers: [InventoryAlertController],
  providers: [InventoryAlertService],
})
export class InventoryAlertModule {}
