/* eslint-disable prettier/prettier */
import {
  IsNumber,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';

export class CalculateTaxDto {
  @IsNumber()
  price: number;

  @IsUUID()
  jurisdictionId: string;

  @IsUUID()
  productCategoryId: string;

  @IsOptional()
  @IsBoolean()
  isExempt?: boolean;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;
}
