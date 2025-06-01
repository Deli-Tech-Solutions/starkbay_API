import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../entities/review.entity';

export class ReviewQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by rating' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Filter by review status',
    enum: ReviewStatus,
  })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiPropertyOptional({ description: 'Filter verified purchases only' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  verifiedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by: newest, oldest, rating_high, rating_low, helpful',
  })
  @IsOptional()
  sortBy?: string = 'newest';
}
