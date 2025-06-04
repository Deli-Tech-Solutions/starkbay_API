import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateRefundDto {
  @IsNotEmpty()
  @IsUUID()
  paymentId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
