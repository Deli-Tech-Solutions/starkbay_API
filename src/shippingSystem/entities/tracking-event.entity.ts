import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Shipping } from './shipping.entity';

export enum TrackingEventType {
  CREATED = 'created',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  EXCEPTION = 'exception',
  RETURNED = 'returned'
}

@Entity('tracking_events')
export class TrackingEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TrackingEventType
  })
  eventType: TrackingEventType;

  @Column()
  description: string;

  @Column()
  location: string;

  @Column()
  timestamp: Date;

  @ManyToOne(() => Shipping, shipping => shipping.trackingEvents)
  shipping: Shipping;

  @CreateDateColumn()
  createdAt: Date;
}
