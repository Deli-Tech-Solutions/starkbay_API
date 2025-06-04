import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from './entities/product.entity';
import { User } from './entities/user.entity';
import { CartService } from './services/cart.service';
import { CartController } from './controllers/cart.controller';
import { CartCleanupTask } from './tasks/cart-cleanup.task';
import { SessionMiddleware } from './middleware/session.middleware';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, CartItem, Product, User]),
    ScheduleModule.forRoot(),
  ],
  providers: [CartService, CartCleanupTask],
  controllers: [CartController],
  exports: [CartService],
})
export class ShoppingSystemModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}