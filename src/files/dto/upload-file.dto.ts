import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsString()
  relatedType?: string; // e.g. "Project", "UserProfile", etc.

  @IsOptional()
  @IsString()
  relatedId?: string;   // The ID of the related entity, if any
}
