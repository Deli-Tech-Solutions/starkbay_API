// src/inventory/services/movement.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryMovement, MovementType } from '../entities/inventory-movement.entity';
import { Inventory } from '../entities/inventory.entity';
import { CreateMovementDto } from '../dto/inventory.dto';
import { AlertService } from './alert.service';

@Injectable()
export class MovementService {
  constructor(
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    private alertService: AlertService,
  ) {}

  async createMovement(createMovementDto: CreateMovementDto): Promise<InventoryMovement> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id: createMovementDto.inventoryId }
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    const previousStock = inventory.currentStock;
    let newStock: number;

    // Calculate new stock based on movement type
    if (createMovementDto.type === MovementType.IN) {
      newStock = previousStock + Math.abs(createMovementDto.quantity);
    } else if (createMovementDto.type === MovementType.OUT) {
      newStock = previousStock - Math.abs(createMovementDto.quantity);
      if (newStock < 0) {
        throw new BadRequestException('Insufficient stock for this movement');
      }
    } else {
      newStock = createMovementDto.quantity; // For adjustments
    }

    // Create movement record
    const movement = this.movementRepository.create({
      ...createMovementDto,
      previousStock,
      newStock,
      quantity: Math.abs(createMovementDto.quantity)
    });

    const savedMovement = await this.movementRepository.save(movement);

    // Update inventory stock
    inventory.currentStock = newStock;
    inventory.availableStock = newStock - inventory.reservedStock;
    await this.inventoryRepository.save(inventory);

    // Check for threshold alerts
    await this.alertService.checkThresholds(inventory.id);

    return savedMovement;
  }

  async getMovementHistory(
    inventoryId?: number,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10
  ) {
    const queryBuilder = this.movementRepository
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.inventory', 'inventory');

    if (inventoryId) {
      queryBuilder.where('movement.inventoryId = :inventoryId', { inventoryId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    }

    queryBuilder
      .orderBy('movement.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [movements, total] = await queryBuilder.getManyAndCount();

    return {
      movements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getMovementsByType(type: MovementType, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.movementRepository.find({
      where: {
        type,
        createdAt: Between(startDate, new Date())
      },
      relations: ['inventory'],
      order: { createdAt: 'DESC' }
    });
  }

  async getMovementSummary(inventoryId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const summary = await this.movementRepository
      .createQueryBuilder('movement')
      .select([
        'movement.type',
        'SUM(movement.quantity) as totalQuantity',
        'COUNT(*) as count'
      ])
      .where('movement.inventoryId = :inventoryId', { inventoryId })
      .andWhere('movement.createdAt >= :startDate', { startDate })
      .groupBy('movement.type')
      .getRawMany();

    return summary.map(item => ({
      type: item.movement_type,
      totalQuantity: parseFloat(item.totalQuantity),
      count: parseInt(item.count)
    }));
  }

  async getDailyMovements(inventoryId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await this.movementRepository
      .createQueryBuilder('movement')
      .select([
        'DATE(movement.createdAt) as date',
        'movement.type',
        'SUM(movement.quantity) as quantity'
      ])
      .where('movement.inventoryId = :inventoryId', { inventoryId })
      .andWhere('movement.createdAt >= :startDate', { startDate })
      .groupBy('DATE(movement.createdAt), movement.type')
      .orderBy('date', 'ASC')
      .getRawMany();

    return movements.map(item => ({
      date: item.date,
      type: item.movement_type,
      quantity: parseFloat(item.quantity)
    }));
  }

  async getTopMovingItems(days: number = 30, limit: number = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topItems = await this.movementRepository
      .createQueryBuilder('movement')
      .leftJoin('movement.inventory', 'inventory')
      .select([
        'inventory.id',
        'inventory.sku',
        'inventory.name',
        'SUM(CASE WHEN movement.type = :outType THEN movement.quantity ELSE 0 END) as outQuantity',
        'COUNT(*) as movementCount'
      ])
      .where('movement.createdAt >= :startDate', { startDate })
      .groupBy('inventory.id, inventory.sku, inventory.name')
      .orderBy('outQuantity', 'DESC')
      .limit(limit)
      .setParameter('outType', MovementType.OUT)
      .getRawMany();

    return topItems.map(item => ({
      inventoryId: item.inventory_id,
      sku: item.inventory_sku,
      name: item.inventory_name,
      outQuantity: parseFloat(item.outQuantity),
      movementCount: parseInt(item.movementCount)
    }));
  }
}