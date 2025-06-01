import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum IndexType {
  SINGLE_COLUMN = 'SINGLE_COLUMN',
  COMPOSITE = 'COMPOSITE',
  PARTIAL = 'PARTIAL',
  EXPRESSION = 'EXPRESSION'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export class CreateIndexDto {
  @ApiProperty({ description: 'Table name for the index' })
  @IsString()
  table: string;

  @ApiProperty({ description: 'Column names for the index', type: [String] })
  @IsOptional()
  columns?: string[];

  @ApiProperty({ description: 'Type of index', enum: IndexType })
  @IsEnum(IndexType)
  type: IndexType;

  @ApiProperty({ description: 'Index name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'WHERE clause for partial indexes', required: false })
  @IsOptional()
  @IsString()
  whereClause?: string;
}

export class IndexStatsDto {
  @ApiProperty({ description: 'Schema name' })
  schema: string;

  @ApiProperty({ description: 'Table name' })
  table: string;

  @ApiProperty({ description: 'Index name' })
  index: string;

  @ApiProperty({ description: 'Number of scans' })
  scans: number;

  @ApiProperty({ description: 'Tuples read' })
  tuplesRead: number;

  @ApiProperty({ description: 'Tuples fetched' })
  tuplesFetched: number;

  @ApiProperty({ description: 'Index size' })
  size: string;

  @ApiProperty({ description: 'Usage level' })
  usageLevel: string;
}
