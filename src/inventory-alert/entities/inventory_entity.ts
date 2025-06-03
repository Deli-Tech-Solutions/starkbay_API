// src/inventory/entities/inventory.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { InventoryMovement } from './inventory-movement.entity';
import { InventoryThreshold } from './inventory-threshold.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  reservedStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  availableStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitCost: number;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => InventoryMovement, movement => movement.inventory)
  movements: InventoryMovement[];

  @OneToMany(() => InventoryThreshold, threshold => threshold.inventory)
  thresholds: InventoryThreshold[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}