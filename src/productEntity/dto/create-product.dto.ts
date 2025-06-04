// productEntity/dto/create-product.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus, Currency } from '../entities/product.entity';

class DimensionsDto {
  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

class OpenGraphDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  type?: string;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  comparePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  trackQuantity?: boolean;

  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  weightUnit?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsString()
  canonicalUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OpenGraphDto)
  openGraph?: OpenGraphDto;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresShipping?: boolean;

  @IsOptional()
  @IsBoolean()
  isDigital?: boolean;

  @IsOptional()
  @IsArray()
  variants?: Array<{
    id: string;
    name: string;
    value: string;
    price?: number;
    sku?: string;
    quantity?: number;
  }>;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;
}