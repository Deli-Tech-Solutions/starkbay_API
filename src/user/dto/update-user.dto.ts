import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsEnum,
  Matches,
  IsObject,
  IsBoolean,
} from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { UserRole, UserStatus } from "../entities/user.entity"

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: "User email address",
    example: "newemail@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    description: "Unique username",
    example: "newusername123",
    minLength: 3,
    maxLength: 30,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "Username can only contain letters, numbers, underscores, and hyphens",
  })
  username?: string

  @ApiPropertyOptional({
    description: "User first name",
    example: "John",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string

  @ApiPropertyOptional({
    description: "User last name",
    example: "Doe",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string

  @ApiPropertyOptional({
    description: "User role",
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @ApiPropertyOptional({
    description: "User status",
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus

  @ApiPropertyOptional({
    description: "Two-factor authentication enabled",
  })
  @IsOptional()
  @IsBoolean()
  twoFactorEnabled?: boolean

  @ApiPropertyOptional({
    description: "Additional metadata",
    example: { lastUpdatedBy: "admin", notes: "Updated profile" },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>
}
