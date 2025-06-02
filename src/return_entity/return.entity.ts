import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ReturnStatus } from '../enums/return-status.enum';
import { ReturnReason } from '../enums/return-reason.enum';
import { ReturnItem } from './return-item.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Return {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order)
  order: Order;

  @ManyToOne(() => User)
  customer: User;

  @Column({ type: 'enum', enum: ReturnStatus, default: ReturnStatus.REQUESTED })
  status: ReturnStatus;

  @Column({ type: 'enum', enum: ReturnReason })
  reason: ReturnReason;

  @Column({ nullable: true })
  comment: string;

  @OneToMany(() => ReturnItem, item => item.return, { cascade: true })
  items: ReturnItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ nullable: true })
  refundId: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  shippingCarrier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}