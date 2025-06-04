import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ShippingZone } from './shipping-zone.entity';
import { ShippingMethod } from './shipping-method.entity';

@Entity('shipping_rates')
export class ShippingRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  minWeight: number;

  @Column('decimal', { precision: 10, scale: 2 })
  maxWeight: number;

  @Column('decimal', { precision: 10, scale: 2 })
  rate: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  freeShippingThreshold: number;

  @ManyToOne(() => ShippingZone, zone => zone.rates)
  shippingZone: ShippingZone;

  @ManyToOne(() => ShippingMethod, method => method.rates)
  shippingMethod: ShippingMethod;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}