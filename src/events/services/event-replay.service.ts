import { Injectable, Logger } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { CustomEventEmitterService } from './event-emitter.service';
import { EventReplayOptions, EventStatus } from '../types/event.types';

@Injectable()
export class EventReplayService {
  private readonly logger = new Logger(EventReplayService.name);

  constructor(
    private readonly eventStore: EventStoreService,
    private readonly eventEmitter: CustomEventEmitterService
  ) {}

  async replayEvents(options: EventReplayOptions): Promise<{
    replayedCount: number;
    failedCount: number;
    totalCount: number;
  }> {
    this.logger.log('Starting event replay...', options);

    const events = await this.eventStore.getEventsForReplay(options);
    let replayedCount = 0;
    let failedCount = 0;

    this.logger.log(`Found ${events.length} events to replay`);

    for (const eventRecord of events) {
      try {
        // Reconstruct the original event payload
        const event = {
          id: eventRecord.id,
          type: eventRecord.eventType,
          data: eventRecord.payload,
          timestamp: eventRecord.createdAt,
          version: eventRecord.version,
          aggregateId: eventRecord.aggregateId,
          userId: eventRecord.metadata?.userId,
          correlationId: eventRecord.metadata?.correlationId,
          causationId: eventRecord.metadata?.causationId,
          metadata: { ...eventRecord.metadata, replayed: true }
        };

        // Re-emit the event
        await this.eventEmitter.emit(
          `${eventRecord.eventType}.replay`,
          event.data,
          {
            ...event,
            causationId: eventRecord.id, // Original event ID as causation
            metadata: { ...event.metadata, originalEventId: eventRecord.id }
          }
        );

        replayedCount++;
        this.logger.debug(`Replayed event: ${eventRecord.eventType} (${eventRecord.id})`);

      } catch (error) {
        failedCount++;
        this.logger.error(
          `Failed to replay event: ${eventRecord.eventType} (${eventRecord.id})`,
          error.stack
        );
      }
    }

    const result = {
      replayedCount,
      failedCount,
      totalCount: events.length
    };

    this.logger.log('Event replay completed', result);
    return result;
  }

  async replayEventsByAggregateId(aggregateId: string): Promise<void> {
    await this.replayEvents({ aggregateIds: [aggregateId] });
  }

  async replayEventsByType(eventType: string, fromDate?: Date): Promise<void> {
    await this.replayEvents({ 
      eventTypes: [eventType],
      fromDate 
    });
  }

  async replayFailedEvents(): Promise<void> {
    this.logger.log('Replaying failed events...');
  }
}