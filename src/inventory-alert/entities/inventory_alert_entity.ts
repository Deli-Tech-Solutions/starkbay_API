// src/inventory/entities/inventory-alert.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AlertType {
  LOW_STOCK = 'low_stock',
  OVERSTOCK = 'overstock',
  REORDER_REQUIRED = 'reorder_required',
  STOCK_OUT = 'stock_out'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('inventory_alerts')
export class InventoryAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inventoryId: number;

  @Column()
  sku: string;

  @Column()
  productName: string;

  @Column({
    type: 'enum',
    enum: AlertType
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE
  })
  status: AlertStatus;

  @Column({
    type: 'enum',
    enum: AlertPriority,
    default: AlertPriority.MEDIUM
  })
  priority: AlertPriority;

  @Column()
  message: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  threshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  suggestedReorderQuantity: number;

  @Column({ nullable: true })
  acknowledgedBy: number;

  @Column({ nullable: true })
  acknowledgedAt: Date;

  @Column({ nullable: true })
  resolvedBy: number;

  @Column({ nullable: true })
  resolvedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}