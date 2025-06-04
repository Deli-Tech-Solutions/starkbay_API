import { IsString, IsNotEmpty, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateShippingZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  states?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  zipCodes?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateShippingZoneDto extends PartialType(CreateShippingZoneDto) {}

