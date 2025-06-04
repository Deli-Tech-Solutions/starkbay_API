import { IsNotEmpty, IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsString()
  customerId: string;

  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsUUID()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  metadata?: any;
}