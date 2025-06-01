import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventPayload, EventStore, EventStatus, EventReplayOptions } from '../types/event.types';
import { EventStoreEntity } from '../entities/event-store.entity';

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(
    @InjectRepository(EventStoreEntity)
    private readonly eventStoreRepository: Repository<EventStoreEntity>
  ) {}

  async saveEvent(event: EventPayload): Promise<void> {
    const eventStore = this.eventStoreRepository.create({
      id: event.id,
      eventType: event.type,
      aggregateId: event.aggregateId || '',
      version: event.version,
      payload: event.data,
      metadata: {
        userId: event.userId,
        correlationId: event.correlationId,
        causationId: event.causationId,
        ...event.metadata
      },
      createdAt: event.timestamp,
      status: EventStatus.PENDING
    });

    await this.eventStoreRepository.save(eventStore);
    this.logger.debug(`Event stored: ${event.type} (${event.id})`);
  }

  async markEventAsProcessed(eventId: string): Promise<void> {
    await this.eventStoreRepository.update(eventId, {
      status: EventStatus.COMPLETED,
      processedAt: new Date()
    });
  }

  async markEventAsFailed(eventId: string, error: string): Promise<void> {
    await this.eventStoreRepository.update(eventId, {
      status: EventStatus.FAILED,
      metadata: { error }
    });
  }

  async getEventById(eventId: string): Promise<EventStoreEntity | null> {
    return this.eventStoreRepository.findOne({ where: { id: eventId } });
  }

  async getEventsByAggregateId(aggregateId: string): Promise<EventStoreEntity[]> {
    return this.eventStoreRepository.find({
      where: { aggregateId },
      order: { createdAt: 'ASC' }
    });
  }

  async getEventsByType(eventType: string, limit = 100): Promise<EventStoreEntity[]> {
    return this.eventStoreRepository.find({
      where: { eventType },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async getEventsForReplay(options: EventReplayOptions): Promise<EventStoreEntity[]> {
    const queryBuilder = this.eventStoreRepository.createQueryBuilder('event');

    if (options.fromDate || options.toDate) {
      queryBuilder.andWhere('event.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: options.fromDate || new Date(0),
        toDate: options.toDate || new Date()
      });
    }

    if (options.eventTypes && options.eventTypes.length > 0) {
      queryBuilder.andWhere('event.eventType IN (:...eventTypes)', {
        eventTypes: options.eventTypes
      });
    }

    if (options.aggregateIds && options.aggregateIds.length > 0) {
      queryBuilder.andWhere('event.aggregateId IN (:...aggregateIds)', {
        aggregateIds: options.aggregateIds
      });
    }

    if (options.version) {
      queryBuilder.andWhere('event.version = :version', { version: options.version });
    }

    queryBuilder.orderBy('event.createdAt', 'ASC');

    if (options.batchSize) {
      queryBuilder.limit(options.batchSize);
    }

    return queryBuilder.getMany();
  }

  async getEventStats(): Promise<{
    totalEvents: number;
    eventsByStatus: Record<EventStatus, number>;
    eventsByType: Record<string, number>;
  }> {
    const totalEvents = await this.eventStoreRepository.count();

    const statusStats = await this.eventStoreRepository
      .createQueryBuilder('event')
      .select('event.status, COUNT(*) as count')
      .groupBy('event.status')
      .getRawMany();

    const typeStats = await this.eventStoreRepository
      .createQueryBuilder('event')
      .select('event.eventType, COUNT(*) as count')
      .groupBy('event.eventType')
      .getRawMany();

    const eventsByStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {} as Record<EventStatus, number>);

    const eventsByType = typeStats.reduce((acc, stat) => {
      acc[stat.eventType] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalEvents,
      eventsByStatus,
      eventsByType
    };
  }
}