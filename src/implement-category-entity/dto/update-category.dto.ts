import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

// src/categories/dto/category-query.dto.ts
import { IsOptional, IsEnum, IsUUID, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by parent category ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ enum: ['active', 'inactive'] })
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({ description: 'Include children in response', default: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeChildren?: boolean;

  @ApiPropertyOptional({ description: 'Maximum depth for children', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  maxDepth?: number;
}
