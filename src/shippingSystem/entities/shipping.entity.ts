import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { ShippingZone } from './shipping-zone.entity';
import { ShippingMethod } from './shipping-method.entity';
import { TrackingEvent } from './tracking-event.entity';

export enum ShippingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned'
}

export enum ShippingCarrier {
  FEDEX = 'fedex',
  UPS = 'ups',
  DHL = 'dhl',
  USPS = 'usps',
  LOCAL = 'local'
}

@Entity('shipments')
export class Shipping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  trackingNumber: string;

  @Column({
    type: 'enum',
    enum: ShippingStatus,
    default: ShippingStatus.PENDING
  })
  status: ShippingStatus;

  @Column({
    type: 'enum',
    enum: ShippingCarrier
  })
  carrier: ShippingCarrier;

  @Column('decimal', { precision: 10, scale: 2 })
  cost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  weight: number;

  @Column('json')
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  @Column('json')
  fromAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column('json')
  toAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ nullable: true })
  estimatedDeliveryDate: Date;

  @Column({ nullable: true })
  actualDeliveryDate: Date;

  @Column({ nullable: true })
  shippedDate: Date;

  @Column('text', { nullable: true })
  notes: string;

  @ManyToOne(() => Order, order => order.shipments)
  order: Order;

  @ManyToOne(() => ShippingZone, zone => zone.shipments)
  shippingZone: ShippingZone;

  @ManyToOne(() => ShippingMethod, method => method.shipments)
  shippingMethod: ShippingMethod;

  @OneToMany(() => TrackingEvent, event => event.shipping)
  trackingEvents: TrackingEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
