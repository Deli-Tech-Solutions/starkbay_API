import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ReviewService } from './review.service';
import { ModerationService } from './services/moderation.service';
import { ReviewController } from './review.controller';
import { Review } from './entities/review.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { ProductRating } from './entities/product-rating.entity';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, ReviewVote, ProductRating]),
    EventEmitterModule.forRoot(),
    OrderModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService, ModerationService],
  exports: [ReviewService],
})
export class ReviewModule {}
