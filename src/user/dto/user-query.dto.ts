import { IsOptional, IsEnum, IsString, IsDateString, IsInt, Min, Max, IsBoolean } from "class-validator"
import { Transform } from "class-transformer"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { UserStatus, UserRole } from "../entities/user.entity"

export class UserQueryDto {
  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => Number.parseInt(value))
  page?: number = 1

  @ApiPropertyOptional({ description: "Items per page", default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => Number.parseInt(value))
  limit?: number = 10

  @ApiPropertyOptional({ description: "Search term for name, email, or username" })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: "Filter by user status",
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus

  @ApiPropertyOptional({
    description: "Filter by user role",
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @ApiPropertyOptional({ description: "Filter by email verification status" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  emailVerified?: boolean

  @ApiPropertyOptional({ description: "Filter by two-factor authentication status" })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === "true")
  twoFactorEnabled?: boolean

  @ApiPropertyOptional({ description: "Filter users created after this date" })
  @IsOptional()
  @IsDateString()
  createdAfter?: string

  @ApiPropertyOptional({ description: "Filter users created before this date" })
  @IsOptional()
  @IsDateString()
  createdBefore?: string

  @ApiPropertyOptional({ description: "Filter users who logged in after this date" })
  @IsOptional()
  @IsDateString()
  lastLoginAfter?: string

  @ApiPropertyOptional({
    description: "Sort by field",
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt"

  @ApiPropertyOptional({
    description: "Sort order",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC"
}
