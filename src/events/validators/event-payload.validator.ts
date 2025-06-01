import { Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { EventPayload } from '../types/event.types';

@Injectable()
export class EventPayloadValidator {
  private readonly eventSchemas = new Map<string, any>();

  registerEventSchema(eventType: string, schema: any): void {
    this.eventSchemas.set(eventType, schema);
  }

  async validateEventPayload(event: EventPayload): Promise<void> {
    // Validate base event structure
    await this.validateBaseEvent(event);

    // Validate specific event payload if schema exists
    const schema = this.eventSchemas.get(event.type);
    if (schema) {
      await this.validateEventData(event.data, schema);
    }
  }

  private async validateBaseEvent(event: EventPayload): Promise<void> {
    const requiredFields = ['id', 'timestamp', 'version', 'type', 'data'];
    
    for (const field of requiredFields) {
      if (!event[field]) {
        throw new BadRequestException(`Missing required field: ${field}`);
      }
    }

    if (typeof event.timestamp === 'string') {
      event.timestamp = new Date(event.timestamp);
    }

    if (isNaN(event.timestamp.getTime())) {
      throw new BadRequestException('Invalid timestamp format');
    }
  }

  private async validateEventData(data: any, schema: any): Promise<void> {
    const instance = plainToClass(schema, data);
    const errors = await validate(instance);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      
      throw new BadRequestException(`Event payload validation failed: ${errorMessages}`);
    }
  }
}
