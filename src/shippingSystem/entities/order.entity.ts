import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Shipping } from './shipping.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderNumber: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @OneToMany(() => Shipping, shipping => shipping.order)
  shipments: Shipping[];
}

