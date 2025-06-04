import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TrackingEventType } from '../entities/tracking-event.entity';

export class UpdateTrackingDto {
  @IsEnum(TrackingEventType)
  eventType: TrackingEventType;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
