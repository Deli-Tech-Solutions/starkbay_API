import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CouponsModule } from './coupons/coupons.module';
import { Coupon } from './coupons/entities/coupon.entity';
import { CouponUsage } from './coupons/entities/coupon-usage.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TransactionModule } from './transaction/transaction.module';
import { RateLimitingModule } from './rate-limiting/rate-limiting.module';
import rateLimitConfig from './config/rate-limit.config';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionModule } from './subscription/subscription.module';
import { Subscription } from './subscription/subscription.entity';
import { InventoryAlertModule } from './inventory-alert/inventory-alert.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'starkbay',
      entities: [Coupon, CouponUsage, Subscription],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    CouponsModule,
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    RateLimitingModule,
    ConfigModule.forRoot({}),
    TransactionModule,
    SubscriptionModule,
    RateLimitingModule,
    ConfigModule.forRoot({
        }),
    InventoryAlertModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
