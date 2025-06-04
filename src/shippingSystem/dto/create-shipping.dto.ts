import { IsNotEmpty, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ShippingCarrier } from '../entities/shipping.entity';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class DimensionsDto {
  @IsNumber()
  length: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;
}

export class CreateShippingDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  shippingMethodId: string;

  @IsString()
  @IsNotEmpty()
  shippingZoneId: string;

  @IsEnum(ShippingCarrier)
  carrier: ShippingCarrier;

  @IsNumber()
  weight: number;

  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions: DimensionsDto;

  @ValidateNested()
  @Type(() => AddressDto)
  fromAddress: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  toAddress: AddressDto;

  @IsOptional()
  @IsString()
  notes?: string;
}
