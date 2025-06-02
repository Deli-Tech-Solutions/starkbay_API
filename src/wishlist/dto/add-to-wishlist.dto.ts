/* eslint-disable prettier/prettier */
import { IsInt } from 'class-validator';

export class AddToWishlistDto {
  @IsInt()
  productId: number;
}
