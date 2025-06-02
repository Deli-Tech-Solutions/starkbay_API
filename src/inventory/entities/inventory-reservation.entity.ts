import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity()
export class InventoryReservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Inventory)
  inventory: Inventory;

  @ManyToOne(() => Order, { nullable: true })
  order: Order;

  @Column()
  quantity: number;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isReleased: boolean;

  @CreateDateColumn()
  createdAt: Date;
}