import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Return } from './return.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';

@Entity()
export class ReturnItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Return, returnRequest => returnRequest.items)
  return: Return;

  @Column()
  orderItemId: string;

  @ManyToOne(() => OrderItem)
  orderItem: OrderItem;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  reason: string;
}