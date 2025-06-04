import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Shipping } from './shipping.entity';
import { ShippingRate } from './shipping-rate.entity';

@Entity('shipping_zones')
export class ShippingZone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('json')
  countries: string[];

  @Column('json', { nullable: true })
  states: string[];

  @Column('json', { nullable: true })
  zipCodes: string[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Shipping, shipping => shipping.shippingZone)
  shipments: Shipping[];

  @OneToMany(() => ShippingRate, rate => rate.shippingZone)
  rates: ShippingRate[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
