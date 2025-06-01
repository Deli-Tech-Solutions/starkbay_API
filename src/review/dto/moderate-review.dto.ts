import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../entities/review.entity';

export class ModerateReviewDto {
  @ApiProperty({ description: 'New review status', enum: ReviewStatus })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @ApiPropertyOptional({ description: 'Moderator notes' })
  @IsOptional()
  @IsString()
  moderatorNotes?: string;
}
