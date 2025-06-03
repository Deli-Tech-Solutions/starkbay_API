import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { ProductRating } from './entities/product-rating.entity';
import { Repository } from 'typeorm';
import { OrderService } from '../order/order.service';
import { ModerationService } from './services/moderation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewStatus } from './entities/review.entity';

const mockReviewRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue({ averageRating: '4.5', totalReviews: '10' }),
  })),
});

const mockVoteRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockProductRatingRepo = () => ({
  upsert: jest.fn(),
});

const mockOrderService = {
  hasUserPurchasedProduct: jest.fn(),
};

const mockModerationService = {
  moderateContent: jest.fn(),
};

const mockEventEmitter = {
  emit: jest.fn(),
};

describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepo: Repository<Review>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useFactory: mockReviewRepo },
        { provide: getRepositoryToken(ReviewVote), useFactory: mockVoteRepo },
        { provide: getRepositoryToken(ProductRating), useFactory: mockProductRatingRepo },
        { provide: OrderService, useValue: mockOrderService },
        { provide: ModerationService, useValue: mockModerationService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepo = module.get<Repository<Review>>(getRepositoryToken(Review));
  });

  describe('create()', () => {
    it('should create a new review successfully', async () => {
      const dto: CreateReviewDto = {
        productId: 1,
        rating: 5,
        title: 'Great product',
        content: 'Exceeded expectations',
      };

      reviewRepo.findOne = jest.fn().mockResolvedValue(null);
      mockOrderService.hasUserPurchasedProduct.mockResolvedValue(true);
      mockModerationService.moderateContent.mockResolvedValue({ approved: true });
      reviewRepo.create = jest.fn().mockReturnValue(dto);
      reviewRepo.save = jest.fn().mockResolvedValue({ id: 123, ...dto });

      const result = await service.create(dto, 42);

      expect(reviewRepo.save).toHaveBeenCalled();
      expect(mockOrderService.hasUserPurchasedProduct).toHaveBeenCalledWith(42, 1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('review.created', expect.any(Object));
    });

    it('should throw if user already reviewed product', async () => {
      reviewRepo.findOne = jest.fn().mockResolvedValue({ id: 999 });

      await expect(
        service.create(
          { productId: 1, rating: 4, title: 'Test', content: 'Review' },
          42,
        ),
      ).rejects.toThrow('You have already reviewed this product');
    });
  });

  describe('vote()', () => {
    it('should create a helpful vote', async () => {
      reviewRepo.findOne = jest.fn().mockResolvedValue({ id: 1, helpfulVotes: 0, totalVotes: 0 });
      const reviewVoteRepo = module.get(getRepositoryToken(ReviewVote));
      reviewVoteRepo.findOne = jest.fn().mockResolvedValue(null);
      reviewVoteRepo.create = jest.fn().mockReturnValue({ isHelpful: true });
      reviewVoteRepo.save = jest.fn().mockResolvedValue({ isHelpful: true });

      const result = await service.vote(1, { isHelpful: true }, 42);

      expect(reviewVoteRepo.save).toHaveBeenCalled();
    });
  });

  describe('moderate()', () => {
    it('should moderate a review and emit event', async () => {
      const review = { id: 1, status: ReviewStatus.PENDING, product: { id: 1 } };
      reviewRepo.findOne = jest.fn().mockResolvedValue(review);
      reviewRepo.save = jest.fn().mockResolvedValue({ ...review, status: ReviewStatus.APPROVED });

      const result = await service.moderate(1, {
        status: ReviewStatus.APPROVED,
        moderatorNotes: 'Looks good',
      });

      expect(result.status).toBe(ReviewStatus.APPROVED);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('review.moderated', expect.any(Object));
    });
  });
});
