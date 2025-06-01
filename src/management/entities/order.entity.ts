import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum OrderItemStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ name: 'order_number', unique: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shipping: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'json' })
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ type: 'json' })
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ name: 'payment_status' })
  paymentStatus: string;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber?: string;

  @Column({ name: 'shipped_at', nullable: true })
  shippedAt?: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt?: Date;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancellation_reason', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderStatusHistory, history => history.order, { cascade: true })
  statusHistory: OrderStatusHistory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'product_sku' })
  productSku: string;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'total_price' })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING
  })
  status: OrderItemStatus;

  @Column({ type: 'json', nullable: true, name: 'product_snapshot' })
  productSnapshot: {
    description: string;
    category: string;
    brand: string;
    specifications: any;
  };

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'previous_status' })
  previousStatus: OrderStatus;

  @Column({ name: 'new_status' })
  newStatus: OrderStatus;

  @Column({ name: 'changed_by' })
  changedBy: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @ManyToOne(() => Order, order => order.statusHistory)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}