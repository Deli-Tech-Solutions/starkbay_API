import { IsString, IsOptional, IsUUID, IsObject } from 'class-validator';

export class ImportDataDto {
  @IsString()
  tableName: string;

  @IsOptional()
  @IsUUID()
  configId?: string;

  @IsOptional()
  @IsObject()
  columnMapping?: Record<string, string>;

  @IsOptional()
  @IsObject()
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateOnly?: boolean;
  };
}
