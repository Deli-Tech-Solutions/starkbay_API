import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsUrl,
  IsObject,
  MaxLength,
  IsBoolean,
  Matches,
} from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { Gender } from "../entities/user-profile.entity"

export class CreateUserProfileDto {
  @ApiPropertyOptional({ description: "User bio", maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string

  @ApiPropertyOptional({ description: "Avatar URL" })
  @IsOptional()
  @IsUrl()
  avatar?: string

  @ApiPropertyOptional({ description: "Date of birth", example: "1990-01-01" })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string

  @ApiPropertyOptional({ description: "Gender", enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender

  @ApiPropertyOptional({ description: "Phone number", example: "+1234567890" })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: "Phone number must be in international format",
  })
  phoneNumber?: string

  @ApiPropertyOptional({ description: "Website URL" })
  @IsOptional()
  @IsUrl()
  website?: string

  @ApiPropertyOptional({ description: "Company name" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  company?: string

  @ApiPropertyOptional({ description: "Job title" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string

  @ApiPropertyOptional({ description: "Location" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string

  @ApiPropertyOptional({ description: "Timezone", example: "America/New_York" })
  @IsOptional()
  @IsString()
  timezone?: string

  @ApiPropertyOptional({ description: "Language code", example: "en" })
  @IsOptional()
  @IsString()
  language?: string

  @ApiPropertyOptional({
    description: "Address information",
    example: {
      street: "123 Main St",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      country: "USA",
    },
  })
  @IsOptional()
  @IsObject()
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }

  @ApiPropertyOptional({
    description: "Social media links",
    example: {
      twitter: "https://twitter.com/username",
      linkedin: "https://linkedin.com/in/username",
    },
  })
  @IsOptional()
  @IsObject()
  socialLinks?: {
    twitter?: string
    linkedin?: string
    github?: string
    facebook?: string
    instagram?: string
  }

  @ApiPropertyOptional({
    description: "Profile visibility",
    enum: ["public", "private", "friends"],
    default: "public",
  })
  @IsOptional()
  @IsEnum(["public", "private", "friends"])
  profileVisibility?: "public" | "private" | "friends"

  @ApiPropertyOptional({ description: "Show email in profile" })
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean

  @ApiPropertyOptional({ description: "Show phone in profile" })
  @IsOptional()
  @IsBoolean()
  showPhone?: boolean
}

export class UpdateUserProfileDto extends CreateUserProfileDto {}
