import { IsUUID, IsEnum, IsInt, IsOptional, IsObject } from 'class-validator';
import { PointsType } from '../entities/points.entity';

export class CreateTransactionDto {
  @IsUUID()
  programId: string;

  @IsEnum(PointsType)
  type: PointsType;

  @IsInt()
  points: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
