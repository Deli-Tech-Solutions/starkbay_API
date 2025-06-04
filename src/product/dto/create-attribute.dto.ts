import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsNumber, Min } from 'class-validator';
import { AttributeType, AttributeInputType } from '../entities/variant-attribute.entity';

export class CreateAttributeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AttributeType)
  type: AttributeType;

  @IsEnum(AttributeInputType)
  inputType: AttributeInputType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;

  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @IsOptional()
  @IsBoolean()
  showInProductList?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };

  @IsOptional()
  metadata?: Record<string, any>;
} 