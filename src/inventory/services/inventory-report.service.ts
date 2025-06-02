import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entities/inventory.entity';
import { InventoryAdjustment } from '../entities/inventory-adjustment.entity';
import { InventoryReport } from '../interfaces/inventory-report.interface';
import { InventoryAlertLevel } from '../enums/inventory-alert-level.enum';
import { InventoryAlertService } from './inventory-alert.service';

@Injectable()
export class InventoryReportService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryAdjustment)
    private adjustmentRepository: Repository<InventoryAdjustment>,
    private alertService: InventoryAlertService,
  ) {}

  async getInventoryStatusReport(): Promise<InventoryReport> {
    const inventories = await this.inventoryRepository.find({
      relations: ['product'],
    });

    const report: InventoryReport = {
      totalProducts: inventories.length,
      outOfStock: 0,
      lowStock: 0,
      inStock: 0,
      inventoryValue: 0,
      products: [],
    };

    for (const inventory of inventories) {
      const alertLevel = await this.alertService.checkInventoryLevels(inventory);
      
      if (alertLevel === InventoryAlertLevel.OUT_OF_STOCK) {
        report.outOfStock++;
      } else if (alertLevel === InventoryAlertLevel.LOW || alertLevel === InventoryAlertLevel.CRITICAL) {
        report.lowStock++;
      } else {
        report.inStock++;
      }

      // Calculate inventory value (assuming product has a costPrice field)
      const value = inventory.quantityOnHand * (inventory.product.costPrice || 0);
      report.inventoryValue += value;

      report.products.push({
        productId: inventory.product.id,
        productName: inventory.product.name,
        quantityOnHand: inventory.quantityOnHand,
        quantityReserved: inventory.quantityReserved,
        alertLevel,
        value,
      });
    }

    return report;
  }

  async getInventoryMovementReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{ adjustments: InventoryAdjustment[]; summary: any }> {
    const adjustments = await this.adjustmentRepository.find({
      where: {
        createdAt: { $between: [startDate, endDate] },
      },
      relations: ['inventory', 'inventory.product', 'adjustedBy'],
    });

    const summary = adjustments.reduce((acc, adj) => {
      acc.totalAdjustments += 1;
      acc.totalQuantity += adj.quantity;
      acc.byType[adj.type] = (acc.byType[adj.type] || 0) + adj.quantity;
      return acc;
    }, {
      totalAdjustments: 0,
      totalQuantity: 0,
      byType: {},
    });

    return { adjustments, summary };
  }

  async getStockTurnoverReport(): Promise<Array<{ productId: string; turnoverRate: number }>> {
    //  Placeholder for the actual calculation logic
    return [];
  }
}