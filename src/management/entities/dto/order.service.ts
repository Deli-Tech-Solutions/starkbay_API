import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderItem, OrderStatusHistory, OrderStatus } from './entities/order.entity';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(OrderStatusHistory)
    private orderStatusHistoryRepository: Repository<OrderStatusHistory>
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const orderNumber = await this.generateOrderNumber();
    
    // Calculate totals
    const subtotal = createOrderDto.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const tax = createOrderDto.tax || 0;
    const shipping = createOrderDto.shipping || 0;
    const discount = createOrderDto.discount || 0;
    const total = subtotal + tax + shipping - discount;

    // Create order
    const order = this.orderRepository.create({
      customerId: createOrderDto.customerId,
      orderNumber,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress,
      paymentMethod: createOrderDto.paymentMethod,
      paymentStatus: 'pending',
      notes: createOrderDto.notes,
      status: OrderStatus.PENDING
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items with product snapshots
    const orderItems = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const productSnapshot = await this.getProductSnapshot(item.productId);
        
        return this.orderItemRepository.create({
          orderId: savedOrder.id,
          productId: item.productId,
          productName: productSnapshot.name,
          productSku: productSnapshot.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          productSnapshot: {
            description: productSnapshot.description,
            category: productSnapshot.category,
            brand: productSnapshot.brand,
            specifications: productSnapshot.specifications
          }
        });
      })
    );

    await this.orderItemRepository.save(orderItems);

    // Create initial status history
    await this.createStatusHistory(savedOrder.id, null, OrderStatus.PENDING, 'system', 'Order created');

    // Send order confirmation notification
    await this.sendOrderNotification(savedOrder.id, 'order_created');

    return this.findOne(savedOrder.id);
  }

  async findAll(customerId?: string, status?: OrderStatus): Promise<Order[]> {
    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.statusHistory', 'statusHistory')
      .orderBy('order.createdAt', 'DESC');

    if (customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId });
    }

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'statusHistory']
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, changedBy: string): Promise<Order> {
    const order = await this.findOne(id);
    
    // Validate status transition
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    const previousStatus = order.status;
    
    // Update order status
    order.status = updateOrderStatusDto.status;
    
    // Handle specific status updates
    switch (updateOrderStatusDto.status) {
      case OrderStatus.SHIPPED:
        order.shippedAt = new Date();
        if (updateOrderStatusDto.trackingNumber) {
          order.trackingNumber = updateOrderStatusDto.trackingNumber;
        }
        break;
      case OrderStatus.DELIVERED:
        order.deliveredAt = new Date();
        break;
    }

    await this.orderRepository.save(order);

    // Create status history
    await this.createStatusHistory(
      id, 
      previousStatus, 
      updateOrderStatusDto.status, 
      changedBy, 
      updateOrderStatusDto.reason
    );

    // Send status update notification
    await this.sendOrderNotification(id, 'status_updated');

    return this.findOne(id);
  }

  async cancelOrder(id: string, cancelOrderDto: CancelOrderDto, cancelledBy: string): Promise<Order> {
    const order = await this.findOne(id);

    // Check if order can be cancelled
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`);
    }

    const previousStatus = order.status;
    
    // Update order
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = cancelOrderDto.reason;

    await this.orderRepository.save(order);

    // Update order items status
    await this.orderItemRepository.update(
      { orderId: id },
      { status: OrderItemStatus.CANCELLED }
    );

    // Create status history
    await this.createStatusHistory(
      id, 
      previousStatus, 
      OrderStatus.CANCELLED, 
      cancelledBy, 
      cancelOrderDto.reason
    );

    // Send cancellation notification
    await this.sendOrderNotification(id, 'order_cancelled');

    return this.findOne(id);
  }

  async getOrderTracking(id: string): Promise<any> {
    const order = await this.findOne(id);
    
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      timeline: order.statusHistory.map(history => ({
        status: history.newStatus,
        timestamp: history.createdAt,
        reason: history.reason
      })),
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      estimatedDelivery: this.calculateEstimatedDelivery(order)
    };
  }

  async getOrderHistory(customerId: string, page: number = 1, limit: number = 10): Promise<any> {
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { customerId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        itemCount: order.items.length,
        createdAt: order.createdAt
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: []
    };

    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async createStatusHistory(
    orderId: string, 
    previousStatus: OrderStatus, 
    newStatus: OrderStatus, 
    changedBy: string, 
    reason?: string
  ): Promise<void> {
    const statusHistory = this.orderStatusHistoryRepository.create({
      orderId,
      previousStatus,
      newStatus,
      changedBy,
      reason
    });

    await this.orderStatusHistoryRepository.save(statusHistory);
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-8)}-${random}`;
  }

  private async getProductSnapshot(productId: string): Promise<any> {
    // This would typically fetch from your product service
    // For now, returning a mock snapshot
    return {
      name: `Product ${productId}`,
      sku: `SKU-${productId}`,
      description: 'Product description',
      category: 'Category',
      brand: 'Brand',
      specifications: {}
    };
  }

  private calculateEstimatedDelivery(order: Order): Date | null {
    if (order.status === OrderStatus.SHIPPED && order.shippedAt) {
      // Add 3-5 business days for delivery
      const deliveryDays = 5;
      const estimatedDate = new Date(order.shippedAt);
      estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
      return estimatedDate;
    }
    return null;
  }

  private async sendOrderNotification(orderId: string, type: string): Promise<void> {
    // This would typically integrate with your notification service
    console.log(`Sending ${type} notification for order ${orderId}`);
    
    // Example notification types:
    // - order_created: Welcome email with order details
    // - status_updated: Status change notification
    // - order_cancelled: Cancellation confirmation
    // - order_shipped: Shipping notification with tracking
    // - order_delivered: Delivery confirmation
  }
}
