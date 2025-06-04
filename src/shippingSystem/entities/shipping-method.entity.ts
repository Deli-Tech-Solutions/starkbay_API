import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Shipping } from './shipping.entity';
import { ShippingRate } from './shipping-rate.entity';

export enum ShippingType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  SAME_DAY = 'same_day',
  PICKUP = 'pickup'
}

@Entity('shipping_methods')
export class ShippingMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ShippingType
  })
  type: ShippingType;

  @Column({
    type: 'enum',
    enum: ShippingCarrier
  })
  carrier: ShippingCarrier;

  @Column('int')
  estimatedDays: number;

  @Column('decimal', { precision: 5, scale: 2 })
  baseCost: number;

  @Column('decimal', { precision: 5, scale: 4 })
  weightMultiplier: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  maxWeight: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Shipping, shipping => shipping.shippingMethod)
  shipments: Shipping[];

  @OneToMany(() => ShippingRate, rate => rate.shippingMethod)
  rates: ShippingRate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
