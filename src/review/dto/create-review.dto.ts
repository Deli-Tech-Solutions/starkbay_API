import {
  IsInt,
  IsString,
  IsNotEmpty,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'Product ID', example: 1 })
  @IsInt()
  productId: number;

  @ApiProperty({
    description: 'Rating from 1 to 5 stars',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    description: 'Review title',
    example: 'Great product!',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    description: 'Review content',
    example: 'This product exceeded my expectations...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
