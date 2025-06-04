// src/inventory/services/alert.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryAlert, AlertType, AlertStatus, AlertPriority } from '../entities/inventory-alert.entity';
import { Inventory } from '../entities/inventory.entity';
import { InventoryThreshold, ThresholdType } from '../entities/inventory-threshold.entity';
import { CreateAlertDto } from '../dto/inventory.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AlertService {
  constructor(
    @InjectRepository(InventoryAlert)
    private alertRepository: Repository<InventoryAlert>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryThreshold)
    private thresholdRepository: Repository<InventoryThreshold>,
    private eventEmitter: EventEmitter2,
  ) {}

  async createAlert(createAlertDto: CreateAlertDto): Promise<InventoryAlert> {
    // Check if similar active alert already exists
    const existingAlert = await this.alertRepository.findOne({
      where: {
        inventoryId: createAlertDto.inventoryId,
        type: createAlertDto.type,
        status: AlertStatus.ACTIVE
      }
    });

    if (existingAlert) {
      // Update existing alert instead of creating duplicate
      existingAlert.currentStock = createAlertDto.currentStock;
      existingAlert.message = createAlertDto.message;
      existingAlert.threshold = createAlertDto.threshold;
      existingAlert.suggestedReorderQuantity = createAlertDto.suggestedReorderQuantity;
      return await this.alertRepository.save(existingAlert);
    }

    const alert = this.alertRepository.create(createAlertDto);
    const savedAlert = await this.alertRepository.save(alert);

    // Emit event for external notifications
    this.eventEmitter.emit('alert.created', savedAlert);

    return savedAlert;
  }

  async checkThresholds(inventoryId: number): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId },
      relations: ['thresholds']
    });

    if (!inventory) return;

    for (const threshold of inventory.thresholds) {
      if (!threshold.isActive) continue;

      await this.evaluateThreshold(inventory, threshold);
    }
  }

  private async evaluateThreshold(inventory: Inventory, threshold: InventoryThreshold): Promise<void> {
    const currentStock = inventory.availableStock;
    let shouldAlert = false;
    let alertType: AlertType;
    let priority: AlertPriority;
    let message: string;
    let suggestedReorderQuantity: number | undefined;

    switch (threshold.type) {
      case ThresholdType.LOW_STOCK:
        shouldAlert = currentStock <= threshold.threshold;
        alertType = currentStock === 0 ? AlertType.STOCK_OUT : AlertType.LOW_STOCK;
        priority = currentStock === 0 ? AlertPriority.CRITICAL : AlertPriority.HIGH;
        message = currentStock === 0 
          ? `${inventory.name} (${inventory.sku}) is out of stock`
          : `${inventory.name} (${inventory.sku}) is running low. Current stock: ${currentStock}, Threshold: ${threshold.threshold}`;
        break;

      case ThresholdType.OVERSTOCK:
        shouldAlert = currentStock >= threshold.threshold;
        alertType = AlertType.OVERSTOCK;
        priority = AlertPriority.MEDIUM;
        message = `${inventory.name} (${inventory.sku}) is overstocked. Current stock: ${currentStock}, Threshold: ${threshold.threshold}`;
        break;

      case ThresholdType.REORDER_POINT:
        shouldAlert = currentStock <= threshold.threshold;
        alertType = AlertType.REORDER_REQUIRED;
        priority = AlertPriority.HIGH;
        suggestedReorderQuantity = threshold.targetStock 
          ? threshold.targetStock - currentStock
          : threshold.threshold * 2;
        message = `${inventory.name} (${inventory.sku}) needs reordering. Current stock: ${currentStock}, Reorder point: ${threshold.threshold}`;
        break;
    }

    if (shouldAlert) {
      await this.createAlert({
        inventoryId: inventory.id,
        sku: inventory.sku,
        productName: inventory.name,
        type: alertType,
        priority,
        message,
        currentStock,
        threshold: threshold.threshold,
        suggestedReorderQuantity
      });
    } else {
      // Resolve any existing alerts of this type if condition is no longer met
      await this.resolveAlerts(inventory.id, alertType);
    }
  }

  async getActiveAlerts(priority?: AlertPriority, type?: AlertType) {
    const queryBuilder = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.status = :status', { status: AlertStatus.ACTIVE });

    if (priority) {
      queryBuilder.andWhere('alert.priority = :priority', { priority });
    }

    if (type) {
      queryBuilder.andWhere('alert.type = :type', { type });
    }

    return await queryBuilder
      .orderBy('alert.priority', 'DESC')
      .addOrderBy('alert.createdAt', 'DESC')
      .getMany();
  }

  async acknowledgeAlert(alertId: number, userId: number): Promise<InventoryAlert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    return await this.alertRepository.save(alert);
  }

  async resolveAlert(alertId: number, userId: number): Promise<InventoryAlert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();

    return await this.alertRepository.save(alert);
  }

  async resolveAlerts(inventoryId: number, type: AlertType, userId?: number): Promise<void> {
    await this.alertRepository.update(
      {
        inventoryId,
        type,
        status: AlertStatus.ACTIVE
      },
      {
        status: AlertStatus.RESOLVED,
        resolvedBy: userId,
        resolvedAt: new Date()
      }
    );
  }

  async dismissAlert(alertId: number): Promise<InventoryAlert> {
    const alert = await this.alertRepository.findOne({ where: { id: alertId } });
    
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.DISMISSED;
    return await this.alertRepository.save(alert);
  }

  async getAlertSummary(): Promise<{
    total: number;
    byPriority: Array<{ priority: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
  }> {
    const total = await this.alertRepository.count();

    const byPriority = await this.alertRepository
      .createQueryBuilder('alert')
      .select(['alert.priority', 'COUNT(*) as count'])
      .groupBy('alert.priority')
      .getRawMany();

    const byType = await this.alertRepository
      .createQueryBuilder('alert')
      .select(['alert.type', 'COUNT(*) as count'])
      .groupBy('alert.type')
      .getRawMany();

    const byStatus = await this.alertRepository
      .createQueryBuilder('alert')
      .select(['alert.status', 'COUNT(*) as count'])
      .groupBy('alert.status')
      .getRawMany();

    return {
      total,
      byPriority: byPriority.map(item => ({
        priority: item.alert_priority,
        count: parseInt(item.count)
      })),
      byType: byType.map(item => ({
        type: item.alert_type,
        count: parseInt(item.count)
      })),
      byStatus: byStatus.map(item => ({
        status: item.alert_status,
        count: parseInt(item.count)
      }))
    };
  }

  async bulkResolveAlerts(alertIds: number[], userId: number): Promise<void> {
    await this.alertRepository.update(
      { id: { $in: alertIds } as any },
      {
        status: AlertStatus.RESOLVED,
        resolvedBy: userId,
        resolvedAt: new Date()
      }
    );
  }

  async getAlertsHistory(days: number = 30, page: number = 1, limit: number = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const queryBuilder = this.alertRepository
      .createQueryBuilder('alert')
      .where('alert.createdAt >= :startDate', { startDate })
      .orderBy('alert.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [alerts, total] = await queryBuilder.getManyAndCount();

    return {
      alerts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}