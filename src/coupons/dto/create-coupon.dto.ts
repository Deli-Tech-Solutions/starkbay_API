import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDate,
  Min,
  ValidateIf,
  IsBoolean,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../entities/coupon.entity';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.discountType === DiscountType.PERCENTAGE)
  @Max(100)
  @ValidateIf((o) => o.discountType === DiscountType.FIXED_AMOUNT)
  @Max(999999)
  discountValue: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumPurchaseAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maximumDiscountAmount?: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isFirstTimeUserOnly?: boolean;

  @IsBoolean()
  @IsOptional()
  isSingleUse?: boolean;
}
