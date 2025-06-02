import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { InventoryAdjustment } from '../entities/inventory-adjustment.entity';
import { InventoryAdjustmentType } from '../enums/inventory-adjustment-type.enum';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';
import { User } from '../../users/entities/user.entity';
import { ProductsService } from '../../products/services/products.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryAdjustment)
    private adjustmentRepository: Repository<InventoryAdjustment>,
    private productsService: ProductsService,
  ) {}

  async createInventory(productId: string): Promise<Inventory> {
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const inventory = this.inventoryRepository.create({
      product,
      trackInventory: true,
    });

    return this.inventoryRepository.save(inventory);
  }

  async getInventory(productId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { product: { id: productId } },
      relations: ['variants', 'adjustments'],
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    return inventory;
  }

  async adjustInventory(
    productId: string,
    adjustInventoryDto: AdjustInventoryDto,
    user?: User,
  ): Promise<Inventory> {
    const inventory = await this.getInventory(productId);
    const { type, quantity, reason, referenceId, referenceType } = adjustInventoryDto;

    const quantityBefore = inventory.quantityOnHand;
    const quantityAfter = quantityBefore + quantity;

    // Create adjustment record
    const adjustment = this.adjustmentRepository.create({
      inventory,
      type,
      quantity,
      quantityBefore,
      quantityAfter,
      reason,
      referenceId,
      referenceType,
      adjustedBy: user,
    });

    // Update inventory
    inventory.quantityOnHand = quantityAfter;
    await this.inventoryRepository.save(inventory);
    await this.adjustmentRepository.save(adjustment);

    return inventory;
  }

  async getAvailableQuantity(productId: string): Promise<number> {
    const inventory = await this.getInventory(productId);
    return inventory.quantityOnHand - inventory.quantityReserved;
  }

  async updateReorderPoints(
    productId: string,
    reorderPoint: number,
    reorderQuantity: number,
  ): Promise<Inventory> {
    const inventory = await this.getInventory(productId);
    inventory.reorderPoint = reorderPoint;
    inventory.reorderQuantity = reorderQuantity;
    return this.inventoryRepository.save(inventory);
  }

  async getInventoryAdjustments(productId: string): Promise<InventoryAdjustment[]> {
    const inventory = await this.getInventory(productId);
    return inventory.adjustments;
  }
}