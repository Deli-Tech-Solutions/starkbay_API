// src/inventory/services/threshold.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryThreshold, ThresholdType } from '../entities/inventory-threshold.entity';
import { Inventory } from '../entities/inventory.entity';
import { CreateThresholdDto, UpdateThresholdDto } from '../dto/inventory.dto';

@Injectable()
export class ThresholdService {
  constructor(
    @InjectRepository(InventoryThreshold)
    private thresholdRepository: Repository<InventoryThreshold>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async createThreshold(createThresholdDto: CreateThresholdDto): Promise<InventoryThreshold> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id: createThresholdDto.inventoryId }
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    // Check if threshold of this type already exists for this inventory
    const existingThreshold = await this.thresholdRepository.findOne({
      where: {
        inventoryId: createThresholdDto.inventoryId,
        type: createThresholdDto.type
      }
    });

    if (existingThreshold) {
      throw new BadRequestException(`Threshold of type ${createThresholdDto.type} already exists for this inventory item`);
    }

    const threshold = this.thresholdRepository.create(createThresholdDto);
    return await this.thresholdRepository.save(threshold);
  }

  async findByInventoryId(inventoryId: number): Promise<InventoryThreshold[]> {
    return await this.thresholdRepository.find({
      where: { inventoryId },
      order: { type: 'ASC' }
    });
  }

  async findByType(type: ThresholdType): Promise<InventoryThreshold[]> {
    return await this.thresholdRepository.find({
      where: { type, isActive: true },
      relations: ['inventory']
    });
  }

  async updateThreshold(id: number, updateThresholdDto: UpdateThresholdDto): Promise<InventoryThreshold> {
    const threshold = await this.thresholdRepository.findOne({
      where: { id }
    });

    if (!threshold) {
      throw new NotFoundException('Threshold not found');
    }

    Object.assign(threshold, updateThresholdDto);
    return await this.thresholdRepository.save(threshold);
  }

  async deleteThreshold(id: number): Promise<void> {
    const threshold = await this.thresholdRepository.findOne({
      where: { id }
    });

    if (!threshold) {
      throw new NotFoundException('Threshold not found');
    }

    await this.thresholdRepository.remove(threshold);
  }

  async checkThreshold(inventoryId: number, type: ThresholdType): Promise<boolean> {
    const threshold = await this.thresholdRepository.findOne({
      where: { inventoryId, type, isActive: true },
      relations: ['inventory']
    });

    if (!threshold || !threshold.inventory) {
      return false;
    }

    const currentStock = threshold.inventory.availableStock;

    switch (type) {
      case ThresholdType.LOW_STOCK:
        return currentStock <= threshold.threshold;
      case ThresholdType.OVERSTOCK:
        return currentStock >= threshold.threshold;
      case ThresholdType.REORDER_POINT:
        return currentStock <= threshold.threshold;
      default:
        return false;
    }
  }

  async getReorderSuggestions(): Promise<Array<{
    inventory: Inventory;
    threshold: InventoryThreshold;
    suggestedQuantity: number;
  }>> {
    const reorderThresholds = await this.thresholdRepository.find({
      where: { type: ThresholdType.REORDER_POINT, isActive: true },
      relations: ['inventory']
    });

    const suggestions = [];

    for (const threshold of reorderThresholds) {
      if (threshold.inventory.availableStock <= threshold.threshold) {
        const suggestedQuantity = threshold.targetStock 
          ? threshold.targetStock - threshold.inventory.availableStock
          : threshold.threshold * 2; // Default to 2x threshold if no target stock

        suggestions.push({
          inventory: threshold.inventory,
          threshold,
          suggestedQuantity: Math.max(suggestedQuantity, 0)
        });
      }
    }

    return suggestions;
  }

  async bulkCreateThresholds(thresholds: CreateThresholdDto[]): Promise<InventoryThreshold[]> {
    const createdThresholds = [];

    for (const thresholdDto of thresholds) {
      try {
        const threshold = await this.createThreshold(thresholdDto);
        createdThresholds.push(threshold);
      } catch (error) {
        // Log error but continue with other thresholds
        console.error(`Failed to create threshold for inventory ${thresholdDto.inventoryId}:`, error.message);
      }
    }

    return createdThresholds;
  }

  async getThresholdAnalytics(): Promise<{
    totalThresholds: number;
    activeThresholds: number;
    thresholdsByType: Array<{ type: string; count: number }>;
    itemsAtRisk: number;
  }> {
    const totalThresholds = await this.thresholdRepository.count();
    const activeThresholds = await this.thresholdRepository.count({
      where: { isActive: true }
    });

    const thresholdsByType = await this.thresholdRepository
      .createQueryBuilder('threshold')
      .select(['threshold.type', 'COUNT(*) as count'])
      .where('threshold.isActive = true')
      .groupBy('threshold.type')
      .getRawMany();

    const itemsAtRisk = await this.thresholdRepository
      .createQueryBuilder('threshold')
      .leftJoin('threshold.inventory', 'inventory')
      .where('threshold.isActive = true')
      .andWhere(
        '(threshold.type = :lowStock AND inventory.availableStock <= threshold.threshold) OR ' +
        '(threshold.type = :overstock AND inventory.availableStock >= threshold.threshold)',
        { lowStock: ThresholdType.LOW_STOCK, overstock: ThresholdType.OVERSTOCK }
      )
      .getCount();

    return {
      totalThresholds,
      activeThresholds,
      thresholdsByType: thresholdsByType.map(item => ({
        type: item.threshold_type,
        count: parseInt(item.count)
      })),
      itemsAtRisk
    };
  }