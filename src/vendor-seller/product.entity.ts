import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock'
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice: number;

  @Column({ type: 'int', default: 0 })
  inventory: number;

  @Column()
  sku: string;

  @Column({ type: 'json', nullable: true })
  images: string[];

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column()
  vendorId: string;

  @ManyToOne(() => Vendor, vendor => vendor.products)
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// vendor-commission.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

export enum CommissionType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

@Entity('vendor_commissions')
export class VendorCommission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendorId: string;

  @Column({ type: 'enum', enum: CommissionType, default: CommissionType.PERCENTAGE })
  type: CommissionType;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  rate: number; // percentage or fixed amount

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximumAmount: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => Vendor, vendor => vendor.commission)
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;
}
