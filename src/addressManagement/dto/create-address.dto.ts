import { IsString, IsOptional, IsEnum, IsBoolean, IsEmail, IsPhoneNumber, Length } from 'class-validator';
import { AddressType, CountryCode } from '../entities/address.entity';

export class CreateAddressDto {
  @IsEnum(AddressType)
  type: AddressType;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @IsString()
  @Length(1, 50)
  firstName: string;

  @IsString()
  @Length(1, 50)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  company?: string;

  @IsString()
  @Length(1, 255)
  addressLine1: string;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  addressLine2?: string;

  @IsString()
  @Length(1, 100)
  city: string;

  @IsString()
  @Length(1, 100)
  stateProvince: string;

  @IsString()
  @Length(1, 20)
  postalCode: string;

  @IsEnum(CountryCode)
  country: CountryCode;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;
}