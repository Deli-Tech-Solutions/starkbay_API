import { IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto, DimensionsDto } from './create-shipping.dto';

export class CalculateShippingDto {
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

  @IsNumber()
  orderValue: number;
}
