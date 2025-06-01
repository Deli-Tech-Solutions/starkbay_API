import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsUUID,
  IsObject,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ContentType, ContentPriority } from '../enums/content.enums';

export class CreateContentDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  content?: any;

  @IsEnum(ContentType)
  type: ContentType;

  @IsOptional()
  @IsEnum(ContentPriority)
  priority?: ContentPriority;

  // SEO Fields
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsString()
  slug?: string;

  // Scheduling
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  // Media
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videos?: string[];

  @IsOptional()
  @IsArray()
  attachments?: any[];

  // Targeting
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetAudience?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetRegions?: string[];

  // Relationships
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsString()
  authorId: string;
}
