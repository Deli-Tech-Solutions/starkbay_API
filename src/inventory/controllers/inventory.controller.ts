import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':productId')
  async getInventory(@Param('productId') productId: string) {
    return this.inventoryService.getInventory(productId);
  }

  @Get(':productId/available')
  async getAvailableQuantity(@Param('productId') productId: string) {
    return { available: await this.inventoryService.getAvailableQuantity(productId) };
  }

  @Get(':productId/adjustments')
  async getAdjustments(@Param('productId') productId: string) {
    return this.inventoryService.getInventoryAdjustments(productId);
  }
}