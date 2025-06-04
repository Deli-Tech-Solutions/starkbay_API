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
import { Product } from '../product.entity';
import { VariantAttributeValue } from './variant-attribute-value.entity';
import { VariantInventory } from './variant-inventory.entity';
import { VariantImage } from './variant-image.entity';

@Entity('product_variants')
@Index(['product', 'isActive'])
@Index(['sku'], { unique: true })
@Index(['product', 'position'])
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ unique: true, length: 100 })
  sku: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice?: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  weight: number;

  @Column({ length: 50, nullable: true })
  weightUnit: string; // 'kg', 'lbs', 'g', 'oz'

  @Column({ type: 'json', nullable: true })
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string; // 'cm', 'in', 'm'
  };

  @Column({ default: 0 })
  position: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  requiresShipping: boolean;

  @Column({ default: true })
  trackInventory: boolean;

  @Column({ length: 50, nullable: true })
  taxCode: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Relationships
  @OneToMany(() => VariantAttributeValue, (attributeValue) => attributeValue.variant, {
    cascade: true,
    eager: true,
  })
  attributeValues: VariantAttributeValue[];

  @OneToMany(() => VariantInventory, (inventory) => inventory.variant, {
    cascade: true,
  })
  inventory: VariantInventory[];

  @OneToMany(() => VariantImage, (image) => image.variant, {
    cascade: true,
  })
  images: VariantImage[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get isOnSale(): boolean {
    return !!(this.compareAtPrice && this.compareAtPrice > this.price);
  }

  get discountAmount(): number {
    if (!this.isOnSale) return 0;
    return this.compareAtPrice! - this.price;
  }

  get discountPercentage(): number {
    if (!this.isOnSale) return 0;
    return Math.round(((this.compareAtPrice! - this.price) / this.compareAtPrice!) * 100);
  }

  get displayName(): string {
    if (this.attributeValues && this.attributeValues.length > 0) {
      const attributes = this.attributeValues
        .map((av) => av.value)
        .join(' / ');
      return `${this.name} (${attributes})`;
    }
    return this.name;
  }

  // Lifecycle hooks
  @BeforeInsert()
  @BeforeUpdate()
  validatePricing() {
    if (this.price < 0) {
      throw new Error('Price cannot be negative');
    }
    if (this.compareAtPrice && this.compareAtPrice <= this.price) {
      this.compareAtPrice = null;
    }
  }
} 