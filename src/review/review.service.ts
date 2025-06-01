import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { ProductRating } from './entities/product-rating.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { VoteReviewDto } from './dto/vote-review.dto';
import { OrderService } from '../order/order.service';
import { ModerationService } from './services/moderation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewVote)
    private reviewVoteRepository: Repository<ReviewVote>,
    @InjectRepository(ProductRating)
    private productRatingRepository: Repository<ProductRating>,
    private orderService: OrderService,
    private moderationService: ModerationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: number,
  ): Promise<Review> {
    const { productId, rating, title, content } = createReviewDto;

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: { product: { id: productId }, user: { id: userId } },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    // Verify purchase
    const isVerifiedPurchase = await this.orderService.hasUserPurchasedProduct(
      userId,
      productId,
    );

    // Auto-moderate the review
    const moderationResult = await this.moderationService.moderateContent(
      title,
      content,
    );

    const review = this.reviewRepository.create({
      rating,
      title,
      content,
      user: { id: userId },
      product: { id: productId },
      isVerifiedPurchase,
      status: moderationResult.approved
        ? ReviewStatus.APPROVED
        : ReviewStatus.FLAGGED,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update product rating aggregation
    await this.updateProductRating(productId);

    // Emit event for analytics
    this.eventEmitter.emit('review.created', {
      reviewId: savedReview.id,
      productId,
      userId,
      rating,
      isVerified: isVerifiedPurchase,
    });

    return this.findOne(savedReview.id);
  }

  async findAll(
    query: ReviewQueryDto,
  ): Promise<{ reviews: Review[]; total: number; totalPages: number }> {
    const { page, limit, rating, status, verifiedOnly, sortBy } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product')
      .where('review.status = :approvedStatus', {
        approvedStatus: ReviewStatus.APPROVED,
      });

    // Apply filters
    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    if (status) {
      queryBuilder.andWhere('review.status = :status', { status });
    }

    if (verifiedOnly) {
      queryBuilder.andWhere('review.isVerifiedPurchase = :verified', {
        verified: true,
      });
    }

    // Apply sorting
    this.applySorting(queryBuilder, sortBy);

    const [reviews, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByProduct(
    productId: number,
    query: ReviewQueryDto,
  ): Promise<{ reviews: Review[]; total: number; totalPages: number }> {
    const { page, limit, rating, sortBy } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .where('review.product.id = :productId', { productId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED });

    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    this.applySorting(queryBuilder, sortBy);

    const [reviews, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(
    id: number,
    updateReviewDto: UpdateReviewDto,
    userId: number,
  ): Promise<Review> {
    const review = await this.findOne(id);

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    if (review.status === ReviewStatus.REJECTED) {
      throw new BadRequestException('Cannot update rejected reviews');
    }

    // Re-moderate if content changed
    if (updateReviewDto.title || updateReviewDto.content) {
      const moderationResult = await this.moderationService.moderateContent(
        updateReviewDto.title || review.title,
        updateReviewDto.content || review.content,
      );

      if (!moderationResult.approved) {
        updateReviewDto['status'] = ReviewStatus.FLAGGED;
      }
    }

    Object.assign(review, updateReviewDto);
    const updatedReview = await this.reviewRepository.save(review);

    // Update product rating if rating changed
    if (updateReviewDto.rating) {
      await this.updateProductRating(review.product.id);
    }

    return updatedReview;
  }

  async remove(id: number, userId: number): Promise<void> {
    const review = await this.findOne(id);

    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const productId = review.product.id;
    await this.reviewRepository.remove(review);

    // Update product rating aggregation
    await this.updateProductRating(productId);
  }

  async moderate(
    id: number,
    moderateReviewDto: ModerateReviewDto,
  ): Promise<Review> {
    const review = await this.findOne(id);

    review.status = moderateReviewDto.status;
    review.moderatorNotes = moderateReviewDto.moderatorNotes;
    review.moderatedAt = new Date();

    const updatedReview = await this.reviewRepository.save(review);

    // Update product rating aggregation
    await this.updateProductRating(review.product.id);

    // Emit moderation event
    this.eventEmitter.emit('review.moderated', {
      reviewId: id,
      status: moderateReviewDto.status,
      moderatorNotes: moderateReviewDto.moderatorNotes,
    });

    return updatedReview;
  }

  async vote(
    reviewId: number,
    voteReviewDto: VoteReviewDto,
    userId: number,
  ): Promise<ReviewVote> {
    const review = await this.findOne(reviewId);

    // Check if user already voted
    let existingVote = await this.reviewVoteRepository.findOne({
      where: { review: { id: reviewId }, user: { id: userId } },
    });

    if (existingVote) {
      // Update existing vote
      const wasHelpful = existingVote.isHelpful;
      existingVote.isHelpful = voteReviewDto.isHelpful;
      await this.reviewVoteRepository.save(existingVote);

      // Update vote counts
      if (wasHelpful !== voteReviewDto.isHelpful) {
        if (voteReviewDto.isHelpful) {
          review.helpfulVotes++;
        } else {
          review.helpfulVotes--;
        }
        await this.reviewRepository.save(review);
      }

      return existingVote;
    } else {
      // Create new vote
      const vote = this.reviewVoteRepository.create({
        isHelpful: voteReviewDto.isHelpful,
        user: { id: userId },
        review: { id: reviewId },
      });

      const savedVote = await this.reviewVoteRepository.save(vote);

      // Update vote counts
      review.totalVotes++;
      if (voteReviewDto.isHelpful) {
        review.helpfulVotes++;
      }
      await this.reviewRepository.save(review);

      return savedVote;
    }
  }

  async getProductRating(productId: number): Promise<ProductRating> {
    return this.productRatingRepository.findOne({
      where: { productId },
      relations: ['product'],
    });
  }

  async getReviewAnalytics(productId?: number): Promise<any> {
    const baseQuery = this.reviewRepository
      .createQueryBuilder('review')
      .where('review.status = :status', { status: ReviewStatus.APPROVED });

    if (productId) {
      baseQuery.andWhere('review.product.id = :productId', { productId });
    }

    const [
      totalReviews,
      averageRating,
      ratingDistribution,
      verificationStats,
      monthlyTrend,
    ] = await Promise.all([
      baseQuery.getCount(),
      baseQuery.select('AVG(review.rating)', 'avg').getRawOne(),
      this.getRatingDistribution(productId),
      this.getVerificationStats(productId),
      this.getMonthlyReviewTrend(productId),
    ]);

    return {
      totalReviews,
      averageRating: parseFloat(averageRating?.avg || '0'),
      ratingDistribution,
      verificationStats,
      monthlyTrend,
    };
  }

  private async updateProductRating(productId: number): Promise<void> {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'AVG(review.rating) as averageRating',
        'COUNT(*) as totalReviews',
        'SUM(CASE WHEN review.rating = 1 THEN 1 ELSE 0 END) as rating1Count',
        'SUM(CASE WHEN review.rating = 2 THEN 1 ELSE 0 END) as rating2Count',
        'SUM(CASE WHEN review.rating = 3 THEN 1 ELSE 0 END) as rating3Count',
        'SUM(CASE WHEN review.rating = 4 THEN 1 ELSE 0 END) as rating4Count',
        'SUM(CASE WHEN review.rating = 5 THEN 1 ELSE 0 END) as rating5Count',
      ])
      .where('review.product.id = :productId', { productId })
      .andWhere('review.status = :status', { status: ReviewStatus.APPROVED })
      .getRawOne();

    await this.productRatingRepository.upsert(
      {
        productId,
        averageRating: parseFloat(stats.averageRating || '0'),
        totalReviews: parseInt(stats.totalReviews || '0'),
        rating1Count: parseInt(stats.rating1Count || '0'),
        rating2Count: parseInt(stats.rating2Count || '0'),
        rating3Count: parseInt(stats.rating3Count || '0'),
        rating4Count: parseInt(stats.rating4Count || '0'),
        rating5Count: parseInt(stats.rating5Count || '0'),
      },
      ['productId'],
    );
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Review>,
    sortBy: string,
  ): void {
    switch (sortBy) {
      case 'oldest':
        queryBuilder.orderBy('review.createdAt', 'ASC');
        break;
      case 'rating_high':
        queryBuilder.orderBy('review.rating', 'DESC');
        break;
      case 'rating_low':
        queryBuilder.orderBy('review.rating', 'ASC');
        break;
      case 'helpful':
        queryBuilder.orderBy('review.helpfulVotes', 'DESC');
        break;
      case 'newest':
      default:
        queryBuilder.orderBy('review.createdAt', 'DESC');
        break;
    }
  }

  private async getRatingDistribution(productId?: number): Promise<any> {
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .select(['review.rating as rating', 'COUNT(*) as count'])
      .where('review.status = :status', { status: ReviewStatus.APPROVED })
      .groupBy('review.rating')
      .orderBy('review.rating', 'ASC');

    if (productId) {
      query.andWhere('review.product.id = :productId', { productId });
    }

    return query.getRawMany();
  }

  private async getVerificationStats(productId?: number): Promise<any> {
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .select(['review.isVerifiedPurchase as isVerified', 'COUNT(*) as count'])
      .where('review.status = :status', { status: ReviewStatus.APPROVED })
      .groupBy('review.isVerifiedPurchase');

    if (productId) {
      query.andWhere('review.product.id = :productId', { productId });
    }

    return query.getRawMany();
  }

  private async getMonthlyReviewTrend(productId?: number): Promise<any> {
    const query = this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'DATE_FORMAT(review.createdAt, "%Y-%m") as month',
        'COUNT(*) as count',
        'AVG(review.rating) as averageRating',
      ])
      .where('review.status = :status', { status: ReviewStatus.APPROVED })
      .andWhere('review.createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)')
      .groupBy('month')
      .orderBy('month', 'ASC');

    if (productId) {
      query.andWhere('review.product.id = :productId', { productId });
    }

    return query.getRawMany();
  }
}
