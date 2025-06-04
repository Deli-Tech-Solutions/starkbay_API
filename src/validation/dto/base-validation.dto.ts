import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsObject, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Sanitize } from '../decorators/sanitize.decorator';

export class BaseValidationDto {
  @IsOptional()
  @IsString()
  @Sanitize()
  id?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  updatedAt?: Date;
}

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => Math.max(1, parseInt(value) || 1))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => Math.min(100, Math.max(1, parseInt(value) || 10)))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @Sanitize()
  sortBy?: string;

  @IsOptional()
  @IsString()
  @Sanitize()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @IsOptional()
  @IsString()
  @Sanitize()
  search?: string;
}
