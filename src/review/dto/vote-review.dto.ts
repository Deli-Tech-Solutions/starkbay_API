import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoteReviewDto {
  @ApiProperty({ description: 'Is the review helpful?', example: true })
  @IsBoolean()
  isHelpful: boolean;
}
