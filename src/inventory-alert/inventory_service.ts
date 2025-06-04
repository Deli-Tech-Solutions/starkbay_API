// src/inventory/services/inventory.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { CreateInventoryDto, UpdateInventoryDto, InventoryQueryDto } from '../dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const existingSku = await this.inventoryRepository.findOne({
      where: { sku: createInventoryDto.sku }
    });

    if (existingSku) {
      throw new BadRequestException('SKU already exists');
    }

    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      availableStock: createInventoryDto.currentStock - (createInventoryDto.reservedStock || 0)
    });

    return await this.inventoryRepository.save(inventory);
  }

  async findAll(query: InventoryQueryDto) {
    const { page, limit, search, category, location, lowStock, overstock } = query;
    const queryBuilder = this.inventoryRepository.createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.thresholds', 'thresholds');

    if (search) {
      queryBuilder.where(
        'inventory.name ILIKE :search OR inventory.sku ILIKE :search',
        { search: `%${search}%` }
      );
    }

    if (category) {
      queryBuilder.andWhere('inventory.category = :category', { category });
    }

    if (location) {
      queryBuilder.andWhere('inventory.location = :location', { location });
    }

    if (lowStock) {
      queryBuilder.andWhere(
        'inventory.availableStock <= (SELECT threshold FROM inventory_thresholds WHERE inventory_id = inventory.id AND type = :lowStockType)',
        { lowStockType: 'low_stock' }
      );
    }

    if (overstock) {
      queryBuilder.andWhere(
        'inventory.availableStock >= (SELECT threshold FROM inventory_thresholds WHERE inventory_id = inventory.id AND type = :overstockType)',
        { overstockType: 'overstock' }
      );
    }

    queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('inventory.name', 'ASC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['movements', 'thresholds']
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    return inventory;
  }

  async findBySku(sku: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { sku },
      relations: ['movements', 'thresholds']
    });

    if (!inventory) {
      throw new NotFoundException('Inventory item not found');
    }

    return inventory;
  }

  async update(id: number, updateInventoryDto: UpdateInventoryDto): Promise<Inventory> {
    const inventory = await this.findOne(id);
    
    Object.assign(inventory, updateInventoryDto);
    return await this.inventoryRepository.save(inventory);
  }

  async updateStock(id: number, newStock: number, reservedStock?: number): Promise<Inventory> {
    const inventory = await this.findOne(id);
    
    inventory.currentStock = newStock;
    if (reservedStock !== undefined) {
      inventory.reservedStock = reservedStock;
    }
    inventory.availableStock = inventory.currentStock - inventory.reservedStock;
    
    return await this.inventoryRepository.save(inventory);
  }

  async remove(id: number): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.remove(inventory);
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.thresholds', 'threshold')
      .where('threshold.type = :type AND inventory.availableStock <= threshold.threshold', {
        type: 'low_stock'
      })
      .andWhere('threshold.isActive = true')
      .getMany();
  }

  async getOverstockItems(): Promise<Inventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.thresholds', 'threshold')
      .where('threshold.type = :type AND inventory.availableStock >= threshold.threshold', {
        type: 'overstock'
      })
      .andWhere('threshold.isActive = true')
      .getMany();
  }

  async getStockValue(): Promise<{ totalValue: number; totalItems: number }> {
    const result = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .select([
        'SUM(inventory.currentStock * inventory.unitCost) as totalValue',
        'COUNT(*) as totalItems'
      ])
      .where('inventory.isActive = true')
      .getRawOne();

    return {
      totalValue: parseFloat(result.totalValue) || 0,
      totalItems: parseInt(result.totalItems) || 0
    };
  }
}