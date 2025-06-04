import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { VariantInventory } from './variant-inventory.entity';

@Entity('variant_inventory_locations')
@Index(['inventory', 'location'])
@Unique(['inventory', 'location'])
export class VariantInventoryLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => VariantInventory, (inventory) => inventory.locations, {
    onDelete: 'CASCADE',
  })
  inventory: VariantInventory;

  @Column({ name: 'inventory_id' })
  inventoryId: string;

  @Column({ length: 100 })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reserved: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  reorderPoint: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxCapacity: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: {
    binLocation?: string;
    zone?: string;
    aisle?: string;
    shelf?: string;
    notes?: string;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get availableQuantity(): number {
    return Math.max(0, this.quantity - this.reserved);
  }

  get isLowStock(): boolean {
    return this.reorderPoint ? this.quantity <= this.reorderPoint : false;
  }

  get capacityPercentage(): number {
    if (!this.maxCapacity || this.maxCapacity === 0) return 100;
    return Math.round((this.quantity / this.maxCapacity) * 100);
  }
} 