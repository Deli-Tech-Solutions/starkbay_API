import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApprovalStatus } from '../../content/enums/content.enums';

export class CreateApprovalDto {
  @IsUUID()
  contentId: string;

  @IsString()
  reviewerId: string;

  @IsString()
  reviewerName: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class UpdateApprovalDto {
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  reviewData?: any;
}
