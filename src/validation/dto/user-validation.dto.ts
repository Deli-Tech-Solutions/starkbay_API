import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  MinLength, 
  MaxLength, 
  IsBoolean,
  IsArray,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { BaseValidationDto } from './base-validation.dto';
import { ValidationGroups } from '../enums/validation-groups.enum';
import { 
  IsStrongPassword, 
  IsValidPhoneNumber, 
  IsUniqueField, 
  IsNotProfane 
} from '../decorators/custom-validators.decorator';
import { SanitizeEmail, SanitizeString } from '../decorators/sanitize.decorator';

export class CreateUserDto extends BaseValidationDto {
  @IsString({ groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @MinLength(2, { groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @MaxLength(50, { groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @IsNotProfane({ groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @SanitizeString()
  firstName: string;

  @IsString({ groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @MinLength(2, { groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @MaxLength(50, { groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @IsNotProfane({ groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @SanitizeString()
  lastName: string;

  @IsEmail({}, { groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @IsUniqueField('email', { groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @SanitizeEmail()
  email: string;

  @IsString({ groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  @IsStrongPassword({ groups: [ValidationGroups.CREATE, ValidationGroups.REGISTRATION] })
  password: string;

  @IsOptional()
  @IsString()
  @IsValidPhoneNumber()
  @SanitizeString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @SanitizeString()
  roles?: string[] = ['user'];
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @MinLength(2, { groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @MaxLength(50, { groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @IsNotProfane({ groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @SanitizeString()
  firstName?: string;

  @IsOptional()
  @IsString({ groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @MinLength(2, { groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @MaxLength(50, { groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @IsNotProfane({ groups: [ValidationGroups.UPDATE, ValidationGroups.PARTIAL_UPDATE] })
  @SanitizeString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @IsValidPhoneNumber()
  @SanitizeString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean({ groups: [ValidationGroups.ADMIN] })
  isActive?: boolean;

  @IsOptional()
  @IsArray({ groups: [ValidationGroups.ADMIN] })
  @IsString({ each: true, groups: [ValidationGroups.ADMIN] })
  roles?: string[];
}

export class LoginDto {
  @IsEmail({}, { groups: [ValidationGroups.LOGIN] })
  @SanitizeEmail()
  email: string;

  @IsString({ groups: [ValidationGroups.LOGIN] })
  @MinLength(1, { groups: [ValidationGroups.LOGIN] })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean = false;
}
