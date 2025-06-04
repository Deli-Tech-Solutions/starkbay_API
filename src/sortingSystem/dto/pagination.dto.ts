import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ 
    description: 'Page number (1-based)', 
    minimum: 1, 
    default: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page', 
    minimum: 1, 
    maximum: 100, 
    default: 10 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Sort field and order (e.g., "name:ASC,createdAt:DESC")',
    example: 'name:ASC,createdAt:DESC'
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ 
    description: 'Search query',
    example: 'john'
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CursorPaginationDto {
  @ApiPropertyOptional({ 
    description: 'Cursor for pagination',
    example: 'eyJpZCI6MTAsImNyZWF0ZWRBdCI6IjIwMjMtMDEtMDFUMDA6MDA6MDBaIn0='
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ 
    description: 'Number of items to fetch', 
    minimum: 1, 
    maximum: 100, 
    default: 10 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Sort field and order (e.g., "name:ASC,createdAt:DESC")',
    example: 'name:ASC,createdAt:DESC'
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ 
    description: 'Search query',
    example: 'john'
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class PaginatedResponseDto<T> {
  @ApiPropertyOptional({ description: 'Array of items' })
  data: T[];

  @ApiPropertyOptional({ description: 'Pagination metadata' })
  meta: {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiPropertyOptional({ description: 'Navigation links' })
  links: {
    first: string;
    previous?: string;
    next?: string;
    last: string;
  };
}

export class CursorPaginatedResponseDto<T> {
  @ApiPropertyOptional({ description: 'Array of items' })
  data: T[];

  @ApiPropertyOptional({ description: 'Cursor pagination metadata' })
  meta: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };

  @ApiPropertyOptional({ description: 'Navigation links' })
  links: {
    previous?: string;
    next?: string;
  };
}