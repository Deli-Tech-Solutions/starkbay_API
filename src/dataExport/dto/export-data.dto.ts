import { IsEnum, IsOptional, IsString, IsArray, IsObject } from 'class-validator';
import { ExportFormat } from '../entities/export-log.entity';

export class ExportDataDto {
  @IsString()
  tableName: string;

  @IsEnum(ExportFormat)
  format: ExportFormat;

  @IsOptional()
  @IsArray()
  columns?: string[];

  @IsOptional()
  @IsObject()
  filters?: any;

  @IsOptional()
  @IsObject()
  formatOptions?: any;

  @IsOptional()
  @IsString()
  fileName?: string;
}