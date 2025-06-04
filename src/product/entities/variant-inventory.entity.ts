import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { VariantInventoryLocation } from './variant-inventory-location.entity';

export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  BACKORDER = 'backorder',
}

@Entity('variant_inventory')
@Index(['variant'])
@Index(['status'])
@Index(['quantityOnHand'])
export class VariantInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.inventory, {
    onDelete: 'CASCADE',
  })
  variant: ProductVariant;

  @Column({ name: 'variant_id' })
  variantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantityOnHand: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantityReserved: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantityCommitted: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantityIncoming: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  reorderPoint: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  reorderQuantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxStockLevel: number;

  @Column({ type: 'enum', enum: InventoryStatus, default: InventoryStatus.IN_STOCK })
  status: InventoryStatus;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ default: false })
  allowBackorder: boolean;

  @Column({ default: false })
  allowOverselling: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => VariantInventoryLocation, (location) => location.inventory)
  locations: VariantInventoryLocation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get quantityAvailable(): number {
    return Math.max(0, this.quantityOnHand - this.quantityReserved - this.quantityCommitted);
  }

  get isInStock(): boolean {
    return this.quantityAvailable > 0 || this.allowBackorder;
  }

  get isLowStock(): boolean {
    return this.reorderPoint ? this.quantityOnHand <= this.reorderPoint : false;
  }

  get stockPercentage(): number {
    if (!this.maxStockLevel || this.maxStockLevel === 0) return 100;
    return Math.round((this.quantityOnHand / this.maxStockLevel) * 100);
  }

  get suggestedReorderQuantity(): number {
    if (!this.reorderQuantity || !this.reorderPoint) return 0;
    if (this.quantityOnHand > this.reorderPoint) return 0;
    return this.reorderQuantity;
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  updateStatus() {
    if (!this.trackInventory) {
      this.status = InventoryStatus.IN_STOCK;
      return;
    }

    if (this.quantityAvailable <= 0) {
      this.status = this.allowBackorder ? InventoryStatus.BACKORDER : InventoryStatus.OUT_OF_STOCK;
    } else if (this.isLowStock) {
      this.status = InventoryStatus.LOW_STOCK;
    } else {
      this.status = InventoryStatus.IN_STOCK;
    }
  }
} 