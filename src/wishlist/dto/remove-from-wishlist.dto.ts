/* eslint-disable prettier/prettier */
import { IsInt } from 'class-validator';

export class RemoveFromWishlistDto {
  @IsInt()
  productId: number;
}
