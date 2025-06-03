// src/inventory/entities/inventory-movement.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Inventory } from './inventory.entity';

export enum MovementType {
  IN = 'in',
  OUT = 'out',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment'
}

export enum MovementReason {
  PURCHASE = 'purchase',
  SALE = 'sale',
  RETURN = 'return',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  STOCK_ADJUSTMENT = 'stock_adjustment',
  PRODUCTION = 'production'
}

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Inventory, inventory => inventory.movements)
  inventory: Inventory;

  @Column()
  inventoryId: number;

  @Column({
    type: 'enum',
    enum: MovementType
  })
  type: MovementType;

  @Column({
    type: 'enum',
    enum: MovementReason
  })
  reason: MovementReason;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  previousStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  newStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ nullable: true })
  reference: string;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;
}