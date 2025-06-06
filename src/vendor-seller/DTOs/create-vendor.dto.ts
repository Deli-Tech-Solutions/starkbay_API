import { IsEmail, IsString, IsOptional, IsEnum, ValidateNested, IsPhoneNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { BusinessType } from '../entities/vendor.entity';

class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string;
}

class BankDetailsDto {
  @IsString()
  accountName: string;

  @IsString()
  accountNumber: string;

  @IsString()
  bankName: string;

  @IsString()
  routingNumber: string;
}

class SocialLinksDto {
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  instagram?: string;
}

export class CreateVendorDto {
  @IsEmail()
  email: string;

  @IsString()
  businessName: string;

  @IsString()
  contactPerson: string;

  @IsPhoneNumber()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsOptional()
  @IsString()
  businessRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;
}
