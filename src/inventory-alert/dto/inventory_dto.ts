// src/inventory/dto/inventory.dto.ts
import { IsString, IsNumber, IsOptional, IsBoolean, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MovementType, MovementReason, ThresholdType, AlertType, AlertPriority } from '../entities';

export class CreateInventoryDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  currentStock: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  reservedStock?: number = 0;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitCost?: number = 0;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateMovementDto {
  @IsNumber()
  inventoryId: number;

  @IsEnum(MovementType)
  type: MovementType;

  @IsEnum(MovementReason)
  reason: MovementReason;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  unitCost?: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateThresholdDto {
  @IsNumber()
  inventoryId: number;

  @IsEnum(ThresholdType)
  type: ThresholdType;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  threshold: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  targetStock?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateThresholdDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  threshold?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  targetStock?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateAlertDto {
  @IsNumber()
  inventoryId: number;

  @IsString()
  sku: string;

  @IsString()
  productName: string;

  @IsEnum(AlertType)
  type: AlertType;

  @IsEnum(AlertPriority)
  priority: AlertPriority;

  @IsString()
  message: string;

  @IsNumber()
  @Type(() => Number)
  currentStock: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  threshold?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  suggestedReorderQuantity?: number;
}

export class InventoryQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;

  @IsOptional()
  @IsBoolean()
  overstock?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;
}