import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { InventoryAlertLevel } from '../enums/inventory-alert-level.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MailService } from '../../mail/services/mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InventoryAlertService implements OnModuleInit {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private eventEmitter: EventEmitter2,
    private mailService: MailService,
  ) {}

  onModuleInit() {
    this.eventEmitter.on('inventory.adjusted', (inventory: Inventory) => {
      this.checkInventoryLevels(inventory);
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async dailyInventoryCheck() {
    const inventories = await this.inventoryRepository.find({
      where: { trackInventory: true },
    });

    for (const inventory of inventories) {
      await this.checkInventoryLevels(inventory);
    }
  }

  async checkInventoryLevels(inventory: Inventory): Promise<InventoryAlertLevel> {
    if (!inventory.trackInventory) {
      return InventoryAlertLevel.NONE;
    }

    const alertLevel = this.determineAlertLevel(inventory);
    
    if (alertLevel !== InventoryAlertLevel.NONE) {
      this.triggerAlert(inventory, alertLevel);
    }

    return alertLevel;
  }

  private determineAlertLevel(inventory: Inventory): InventoryAlertLevel {
    if (inventory.quantityOnHand <= 0) {
      return InventoryAlertLevel.OUT_OF_STOCK;
    }

    if (!inventory.reorderPoint) {
      return InventoryAlertLevel.NONE;
    }

    const percentage = (inventory.quantityOnHand / inventory.reorderPoint) * 100;

    if (percentage <= 20) {
      return InventoryAlertLevel.CRITICAL;
    }

    if (percentage <= 50) {
      return InventoryAlertLevel.LOW;
    }

    return InventoryAlertLevel.NONE;
  }

  private async triggerAlert(inventory: Inventory, level: InventoryAlertLevel) {
    const subject = `Inventory Alert: ${level} stock for ${inventory.product.name}`;
    const message = `Current stock level: ${inventory.quantityOnHand}`;

    // Send email to relevant parties
    await this.mailService.sendInventoryAlert({
      to: 'inventory@example.com',
      subject,
      template: 'inventory-alert',
      context: {
        productName: inventory.product.name,
        currentStock: inventory.quantityOnHand,
        reorderPoint: inventory.reorderPoint,
        alertLevel: level,
      },
    });

    // Emit event for other systems
    this.eventEmitter.emit('inventory.alert', {
      inventory,
      level,
      timestamp: new Date(),
    });
  }

  async calculateAutoReorderPoints(productId: string): Promise<{ reorderPoint: number; reorderQuantity: number }> {
    
    // Placeholder for the actual calculation logic
    return {
      reorderPoint: 25,
      reorderQuantity: 100,
    };
  }
}