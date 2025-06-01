import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { EventPayload, BaseEvent } from '../types/event.types';
import { EventPayloadValidator } from '../validators/event-payload.validator';
import { EventStoreService } from './event-store.service';
import { EventMonitoringService } from './event-monitoring.service';

@Injectable()
export class CustomEventEmitterService {
  private readonly logger = new Logger(CustomEventEmitterService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly eventValidator: EventPayloadValidator,
    private readonly eventStore: EventStoreService,
    private readonly eventMonitoring: EventMonitoringService
  ) {}

  async emit<T = any>(
    eventType: string, 
    data: T, 
    options: Partial<BaseEvent> = {}
  ): Promise<string> {
    const eventId = uuidv4();
    const correlationId = options.correlationId || uuidv4();

    const event: EventPayload = {
      id: eventId,
      timestamp: new Date(),
      version: options.version || '1.0.0',
      type: eventType,
      data,
      aggregateId: options.aggregateId,
      userId: options.userId,
      correlationId,
      causationId: options.causationId,
      metadata: options.metadata || {}
    };

    try {
      // Validate event payload
      await this.eventValidator.validateEventPayload(event);

      // Store event
      await this.eventStore.saveEvent(event);

      // Monitor event
      await this.eventMonitoring.trackEventEmission(event);

      // Emit event
      this.eventEmitter.emit(eventType, event);

      this.logger.log(`Event emitted: ${eventType} (${eventId})`);
      return eventId;

    } catch (error) {
      this.logger.error(`Failed to emit event: ${eventType}`, error.stack);
      await this.eventMonitoring.trackEventError(event, error);
      throw error;
    }
  }

  async emitAsync<T = any>(
    eventType: string, 
    data: T, 
    options: Partial<BaseEvent> = {}
  ): Promise<string> {
    const eventId = await this.emit(eventType, data, options);
    
    // Wait for all listeners to complete
    await this.eventEmitter.emitAsync(eventType, data);
    
    return eventId;
  }

  async emitBatch(events: Array<{ type: string; data: any; options?: Partial<BaseEvent> }>): Promise<string[]> {
    const eventIds: string[] = [];

    for (const event of events) {
      try {
        const eventId = await this.emit(event.type, event.data, event.options);
        eventIds.push(eventId);
      } catch (error) {
        this.logger.error(`Failed to emit batch event: ${event.type}`, error.stack);
      }
    }

    return eventIds;
  }

  getListeners(eventType: string): Function[] {
    return this.eventEmitter.listeners(eventType);
  }

  removeAllListeners(eventType?: string): void {
    this.eventEmitter.removeAllListeners(eventType);
  }
}