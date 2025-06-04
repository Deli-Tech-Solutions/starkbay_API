import { IsNotEmpty, IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { PaymentMethodType } from '../entities/payment-method.entity';

export class CreatePaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  configuration?: any;
}