import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { PaymentMethod } from './payment-method.entity';
import { Refund } from './refund.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column()
  customerId: string;

  @Column()
  orderId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ManyToOne(() => PaymentMethod, paymentMethod => paymentMethod.payments)
  paymentMethod: PaymentMethod;

  @OneToMany(() => Refund, refund => refund.payment)
  refunds: Refund[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
