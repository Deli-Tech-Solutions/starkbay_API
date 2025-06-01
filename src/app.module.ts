import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CouponsModule } from './coupons/coupons.module';
import { Coupon } from './coupons/entities/coupon.entity';
import { CouponUsage } from './coupons/entities/coupon-usage.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { IndexingModule } from './modules/indexing/indexing.module';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'starkbay',
      entities: [Coupon, CouponUsage],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    CouponsModule,
    ScheduleModule.forRoot(),
    IndexingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
