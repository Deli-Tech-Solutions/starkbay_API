import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyProgram } from './entities/loyalty-program.entity';
import { LoyaltyTier } from './entities/loyalty-tier.entity';
import { Reward } from './entities/reward.entity';
import { PointsTransaction } from './entities/points.entity';
import { User } from '../users/user.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LoyaltyProgram,
      LoyaltyTier,
      Reward,
      PointsTransaction,
      User,
    ]),
    NotificationModule,
  ],
  providers: [LoyaltyService],
  controllers: [LoyaltyController],
})
export class LoyaltyModule {}
