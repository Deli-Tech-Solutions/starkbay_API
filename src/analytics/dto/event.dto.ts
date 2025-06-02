/* eslint-disable prettier/prettier */
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class CreateEventDto {
  @IsEnum([
    'view_product',
    'add_to_cart',
    'remove_from_cart',
    'checkout',
    'purchase',
  ])
  type: string;

  @IsUUID()
  @IsOptional()
  product?: string;

  @IsUUID()
  @IsOptional()
  user?: string;

  metadata?: Record<string, any>;
}
