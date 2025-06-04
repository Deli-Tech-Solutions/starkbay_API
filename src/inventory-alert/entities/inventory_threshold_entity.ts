// src/inventory/entities/inventory-threshold.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Inventory } from './inventory.entity';

export enum ThresholdType {
  LOW_STOCK = 'low_stock',
  OVERSTOCK = 'overstock',
  REORDER_POINT = 'reorder_point'
}

@Entity('inventory_thresholds')
export class InventoryThreshold {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inventory, inventory => inventory.thresholds)
  inventory: Inventory;

  @Column()
  inventoryId: number;

  @Column({
    type: 'enum',
    enum: ThresholdType
  })
  type: ThresholdType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  threshold: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  targetStock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}