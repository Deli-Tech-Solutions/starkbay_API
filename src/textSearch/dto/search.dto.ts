import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchDto {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Search category filter' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Tags filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['relevance', 'date', 'views', 'rating'] })
  @IsOptional()
  @IsString()
  sort_by?: 'relevance' | 'date' | 'views' | 'rating' = 'relevance';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: 'Enable search highlighting', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  highlight?: boolean = true;

  @ApiPropertyOptional({ description: 'Search entity type', enum: ['all', 'articles', 'products'] })
  @IsOptional()
  @IsString()
  entity_type?: 'all' | 'articles' | 'products' = 'all';
}

export class SearchFacetsDto {
  @ApiPropertyOptional({ description: 'Include category facets', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  include_categories?: boolean = true;

  @ApiPropertyOptional({ description: 'Include tag facets', default: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  include_tags?: boolean = true;

  @ApiPropertyOptional({ description: 'Maximum facet items per type', minimum: 1, maximum: 50, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  max_facets?: number = 10;
}
