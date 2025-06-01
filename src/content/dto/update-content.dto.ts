import { PartialType } from '@nestjs/mapped-types';
import { CreateContentDto } from './create-content.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { ContentStatus } from '../enums/content.enums';

export class UpdateContentDto extends PartialType(CreateContentDto) {
  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}
