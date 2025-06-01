import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
  ) {}

  async hasUserPurchasedProduct(
    userId: number,
    productId: number,
  ): Promise<boolean> {
    const orderItem = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .innerJoin('orderItem.order', 'order')
      .where('order.userId = :userId', { userId })
      .andWhere('orderItem.productId = :productId', { productId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['completed', 'delivered'],
      })
      .getOne();

    return !!orderItem;
  }
}
