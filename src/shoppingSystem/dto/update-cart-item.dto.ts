import { IsUUID, IsInt, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsUUID()
  cartItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
