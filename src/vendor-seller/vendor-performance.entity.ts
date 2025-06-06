import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('vendor_performance')
export class VendorPerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  vendorId: string;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCommission: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'int', default: 0 })
  cancelledOrders: number;

  @Column({ type: 'int', default: 0 })
  returnedOrders: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  fulfillmentRate: number; // percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  onTimeDeliveryRate: number; // percentage

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Vendor, vendor => vendor.performance)
  @JoinColumn({ name: 'vendorId' })
  vendor: Vendor;
}
