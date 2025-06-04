import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { BillingCycle } from '../subscription.entity';


export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsEnum(BillingCycle)
  billingCycle: BillingCycle;

  @IsDateString()
  startDate: string;
}

export class UpdateSubscriptionDto {
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsOptional()
  isPaused?: boolean;
}
