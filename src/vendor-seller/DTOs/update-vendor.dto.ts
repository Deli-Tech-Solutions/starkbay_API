import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {}

// verify-vendor.dto.ts
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VendorStatus } from '../entities/vendor.entity';

export class VerifyVendorDto {
  @IsEnum(VendorStatus)
  status: VendorStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
