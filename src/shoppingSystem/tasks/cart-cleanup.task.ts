import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartService } from '../services/cart.service';

@Injectable()
export class CartCleanupTask {
  constructor(private readonly cartService: CartService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCartCleanup() {
    console.log('Running cart cleanup task...');
    await this.cartService.cleanupExpiredCarts();
    console.log('Cart cleanup task completed');
  }
}
