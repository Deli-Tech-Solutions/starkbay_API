import { IsString, IsNotEmpty, IsEmail, IsOptional } from "class-validator"
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class VerifyEmailDto {
  @ApiProperty({
    description: "Verification token",
    example: "abc123def456ghi789",
  })
  @IsString()
  @IsNotEmpty()
  token: string

  @ApiPropertyOptional({
    description: "Email address to verify",
    example: "user@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string
}

export class ResendVerificationDto {
  @ApiProperty({
    description: "Email address to resend verification",
    example: "user@example.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string
}
