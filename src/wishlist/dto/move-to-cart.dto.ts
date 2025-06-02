/* eslint-disable prettier/prettier */
import { IsInt } from 'class-validator';

export class MoveToCartDto {
  @IsInt()
  productId: number;
}
