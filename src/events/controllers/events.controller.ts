import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    UseFilters,
    ParseIntPipe,
    ValidationPipe,
    UsePipes,
    Delete,
  } from '@nestjs/common';
  import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiBody, 
    ApiParam,
    ApiQuery,
  } from '@nestjs/swagger';
  import { CustomEventEmitterService } from '../services/event-emitter.service';
  import { EventStoreService } from '../services/event-store.service';
  import { EventMonitoringService } from '../services/event-monitoring.service';
  import { EventReplayService } from '../services/event-replay.service';
  import { EventSubscriberService } from '../services/event-subscriber.service';
  import { EventVersioningService } from '../services/event-versioning.service';
  import { EmitEventDto, ReplayEventsDto } from '../dto/events.dto';
  import { EventReplayOptions } from '../types/event.types';
  
  @ApiTags('Events')
  @Controller('events')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  export class EventsController {
    constructor(
      private readonly eventEmitter: CustomEventEmitterService,
      private readonly eventStore: EventStoreService,
      private readonly eventMonitoring: EventMonitoringService,
      private readonly eventReplay: EventReplayService,
      private readonly eventSubscriber: EventSubscriberService,
      private readonly eventVersioning: EventVersioningService,
    ) {}
  
    // ============================================================================
    // EVENT EMISSION ENDPOINTS
    // ============================================================================
  
    @Post('emit')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
      summary: 'Emit a custom event',
      description: 'Emit a single event with payload validation and monitoring'
    })
    @ApiResponse({ 
      status: 200, 
      description: 'Event emitted successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          eventId: { type: 'string', example: 'uuid-v4' },
          timestamp: { type: 'string', example: '2023-12-19T10:00:00.000Z' },
        }
      }
    })
    @ApiResponse({ status: 400, description: 'Invalid event payload' })
    @ApiBody({ type: EmitEventDto })
    async emitEvent(@Body() dto: EmitEventDto) {
      const eventId = await this.eventEmitter.emit(dto.type, dto.data, dto.options);
      
      return {
        success: true,
        eventId,
        timestamp: new Date().toISOString(),
        message: `Event '${dto.type}' emitted successfully`,
      };
    }
  
    @Post('emit-batch')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
      summary: 'Emit multiple events in batch',
      description: 'Emit multiple events in a single request for better performance'
    })
    @ApiResponse({ 
      status: 200, 
      description: 'Batch events emitted successfully'
    })
    async emitBatchEvents(@Body() events: EmitEventDto[]) {
      const eventIds = await this.eventEmitter.emitBatch(
        events.map(event => ({
          type: event.type,
          data: event.data,
          options: event.options,
        }))
      );
  
      return {
        success: true,
        eventIds,
        count: eventIds.length,
        failed: events.length - eventIds.length,
        timestamp: new Date().toISOString(),
      };
    }
  
    @Post('emit-async')
    @HttpCode(HttpStatus.ACCEPTED)
    @ApiOperation({ 
      summary: 'Emit event asynchronously',
      description: 'Emit an event and wait for all subscribers to complete processing'
    })
    @ApiResponse({ status: 202, description: 'Event processing initiated' })
    @ApiBody({ type: EmitEventDto })
    async emitEventAsync(@Body() dto: EmitEventDto) {
      const eventId = await this.eventEmitter.emitAsync(dto.type, dto.data, dto.options);
      
      return {
        success: true,
        eventId,
        message: 'Event processing completed',
        timestamp: new Date().toISOString(),
      };
    }
  
    // ============================================================================
    // EVENT STORE ENDPOINTS
    // ============================================================================
  
    @Get('store/:id')
    @ApiOperation({ summary: 'Get event by ID from store' })
    @ApiParam({ name: 'id', description: 'Event UUID' })
    @ApiResponse({ status: 200, description: 'Event retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Event not found' })
    async getEventById(@Param('id') id: string) {
      const event = await this.eventStore.getEventById(id);
      
      if (!event) {
        return {
          success: false,
          message: 'Event not found',
          eventId: id,
        };
      }
  
      return {
        success: true,
        event,
        timestamp: new Date().toISOString(),
      };
    }
  
    @Get('store/aggregate/:aggregateId')
    @ApiOperation({ summary: 'Get events by aggregate ID' })
    @ApiParam({ name: 'aggregateId', description: 'Aggregate identifier' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of events' })
    @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Pagination offset' })
    @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
    async getEventsByAggregateId(
      @Param('aggregateId') aggregateId: string,
      @Query('limit', new ParseIntPipe({ optional: true })) limit = 100,
      @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
    ) {
      const events = await this.eventStore.getEventsByAggregateId(aggregateId);
      const paginatedEvents = events.slice(offset, offset + limit);
      
      return {
        success: true,
        events: paginatedEvents,
        count: paginatedEvents.length,
        total: events.length,
        aggregateId,
        pagination: {
          limit,
          offset,
          hasMore: events.length > offset + limit,
        },
      };
    }
  
    @Get('store/type/:eventType')
    @ApiOperation({ summary: 'Get events by type' })
    @ApiParam({ name: 'eventType', description: 'Event type name' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
    async getEventsByType(
      @Param('eventType') eventType: string,
      @Query('limit', new ParseIntPipe({ optional: true })) limit = 100,
    ) {
      const events = await this.eventStore.getEventsByType(eventType, limit);
      
      return {
        success: true,
        events,
        count: events.length,
        eventType,
        limit,
      };
    }
  
    // ============================================================================
    // MONITORING & STATISTICS ENDPOINTS
    // ============================================================================
  
    @Get('stats')
    @ApiOperation({ summary: 'Get event store statistics' })
    @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
    async getEventStats() {
      const stats = await this.eventStore.getEventStats();
      
      return {
        success: true,
        stats,
        timestamp: new Date().toISOString(),
      };
    }
  
    @Get('metrics')
    @ApiOperation({ summary: 'Get event monitoring metrics' })
    @ApiQuery({ name: 'eventType', required: false, description: 'Filter by specific event type' })
    @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
    async getEventMetrics(@Query('eventType') eventType?: string) {
      const metrics = this.eventMonitoring.getEventMetrics(eventType);
      
      return {
        success: true,
        metrics,
        count: metrics.length,
        filter: eventType ? { eventType } : null,
        timestamp: new Date().toISOString(),
      };
    }
  
    @Get('health')
    @ApiOperation({ summary: 'Get event system health status' })
    @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
    async getSystemHealth() {
      const health = await this.eventMonitoring.getSystemHealth();
      
      return {
        success: true,
        health,
        timestamp: new Date().toISOString(),
      };
    }
  
    // ============================================================================
    // SUBSCRIBER MANAGEMENT ENDPOINTS
    // ============================================================================
  
    @Get('subscribers')
    @ApiOperation({ summary: 'Get registered event subscribers' })
    @ApiQuery({ name: 'eventType', required: false, description: 'Filter by event type' })
    @ApiResponse({ status: 200, description: 'Subscribers retrieved successfully' })
    async getSubscribers(@Query('eventType') eventType?: string) {
      let subscribers;
      
      if (eventType) {
        const eventSubscribers = this.eventSubscriber.getSubscribersForEvent(eventType);
        subscribers = [{
          eventType,
          subscribers: eventSubscribers,
          count: eventSubscribers.length,
        }];
      } else {
        const allSubscribers = this.eventSubscriber.getAllSubscribers();
        subscribers = Array.from(allSubscribers.entries()).map(([type, subs]) => ({
          eventType: type,
          subscribers: subs.map(sub => ({
            handler: sub.methodName,
            class: sub.instance.constructor.name,
            options: sub.options,
          })),
          count: subs.length,
        }));
      }
  
      const totalSubscribers = subscribers.reduce((total, item) => total + item.count, 0);
  
      return {
        success: true,
        subscribers,
        totalSubscribers,
        eventTypes: subscribers.length,
        filter: eventType ? { eventType } : null,
      };
    }
  
    // ============================================================================
    // EVENT REPLAY ENDPOINTS
    // ============================================================================
  
    @Post('replay')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
      summary: 'Replay events based on criteria',
      description: 'Replay historical events for debugging or data recovery'
    })
    @ApiResponse({ status: 200, description: 'Events replayed successfully' })
    @ApiBody({ type: ReplayEventsDto })
    async replayEvents(@Body() dto: ReplayEventsDto) {
      const options: EventReplayOptions = {
        fromDate: dto.fromDate ? new Date(dto.fromDate) : undefined,
        toDate: dto.toDate ? new Date(dto.toDate) : undefined,
        eventTypes: dto.eventTypes,
        aggregateIds: dto.aggregateIds,
        version: dto.version,
        batchSize: dto.batchSize,
      };
  
      const result = await this.eventReplay.replayEvents(options);
      
      return {
        success: true,
        result,
        criteria: options,
        timestamp: new Date().toISOString(),
      };
    }
  
    @Post('replay/aggregate/:aggregateId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Replay events for specific aggregate' })
    @ApiParam({ name: 'aggregateId', description: 'Aggregate identifier' })
    @ApiResponse({ status: 200, description: 'Aggregate events replayed successfully' })
    async replayAggregateEvents(@Param('aggregateId') aggregateId: string) {
      await this.eventReplay.replayEventsByAggregateId(aggregateId);
      
      return {
        success: true,
        message: `Events replayed for aggregate: ${aggregateId}`,
        aggregateId,
        timestamp: new Date().toISOString(),
      };
    }
  
    @Post('replay/type/:eventType')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Replay events of specific type' })
    @ApiParam({ name: 'eventType', description: 'Event type name' })
    @ApiQuery({ name: 'fromDate', required: false, description: 'Start date (ISO string)' })
    @ApiResponse({ status: 200, description: 'Type events replayed successfully' })
    async replayEventsByType(
      @Param('eventType') eventType: string,
      @Query('fromDate') fromDate?: string,
    ) {
      const from = fromDate ? new Date(fromDate) : undefined;
      await this.eventReplay.replayEventsByType(eventType, from);
      
      return {
        success: true,
        message: `Events replayed for type: ${eventType}`,
        eventType,
        fromDate: from?.toISOString(),
        timestamp: new Date().toISOString(),
      };
    }
  
    // ============================================================================
    // EVENT VERSIONING ENDPOINTS
    // ============================================================================
  
    @Get('versions/:eventType')
    @ApiOperation({ summary: 'Get available versions for event type' })
    @ApiParam({ name: 'eventType', description: 'Event type name' })
    @ApiResponse({ status: 200, description: 'Available versions retrieved' })
    async getEventVersions(@Param('eventType') eventType: string) {
      const versions = this.eventVersioning.getAvailableVersions(eventType);
      
      return {
        success: true,
        eventType,
        versions,
        count: versions.length,
      };
    }
  
    @Post('migrate/:eventType/:targetVersion')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Migrate event to target version' })
    @ApiParam({ name: 'eventType', description: 'Event type name' })
    @ApiParam({ name: 'targetVersion', description: 'Target version (e.g., 2.0.0)' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          eventData: { type: 'object', description: 'Event payload to migrate' },
          currentVersion: { type: 'string', description: 'Current event version' },
        }
      }
    })
    async migrateEvent(
      @Param('eventType') eventType: string,
      @Param('targetVersion') targetVersion: string,
      @Body() body: { eventData: any; currentVersion: string },
    ) {
      const event = {
        id: 'migration-test',
        type: eventType,
        data: body.eventData,
        version: body.currentVersion,
        timestamp: new Date(),
      } as any;
  
      const migratedEvent = this.eventVersioning.migrateEvent(event, targetVersion);
      
      return {
        success: true,
        original: {
          version: body.currentVersion,
          data: body.eventData,
        },
        migrated: {
          version: migratedEvent.version,
          data: migratedEvent.data,
          metadata: migratedEvent.metadata,
        },
        eventType,
        targetVersion,
      };
    }
  
    // ============================================================================
    // UTILITY ENDPOINTS
    // ============================================================================
  
    @Get('listeners/:eventType')
    @ApiOperation({ summary: 'Get active listeners for event type' })
    @ApiParam({ name: 'eventType', description: 'Event type name' })
    @ApiResponse({ status: 200, description: 'Active listeners retrieved' })
    async getEventListeners(@Param('eventType') eventType: string) {
      const listeners = this.eventEmitter.getListeners(eventType);
      
      return {
        success: true,
        eventType,
        listeners: listeners.map((listener, index) => ({
          index,
          name: listener.name || 'anonymous',
          type: typeof listener,
        })),
        count: listeners.length,
      };
    }
  
    @Delete('listeners/:eventType')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove all listeners for event type' })
    @ApiParam({ name: 'eventType', description: 'Event type name' })
    @ApiResponse({ status: 204, description: 'Listeners removed successfully' })
    async removeEventListeners(@Param('eventType') eventType: string) {
      this.eventEmitter.removeAllListeners(eventType);
      
      return {
        success: true,
        message: `All listeners removed for event type: ${eventType}`,
        eventType,
      };
    }
  
    @Get('system/info')
    @ApiOperation({ summary: 'Get event system information' })
    @ApiResponse({ status: 200, description: 'System information retrieved' })
    async getSystemInfo() {
      const stats = await this.eventStore.getEventStats();
      const health = await this.eventMonitoring.getSystemHealth();
      const allSubscribers = this.eventSubscriber.getAllSubscribers();
      
      const subscriberCount = Array.from(allSubscribers.values())
        .reduce((total, subs) => total + subs.length, 0);
  
      return {
        success: true,
        system: {
          version: '1.0.0',
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
        },
        events: {
          totalEvents: stats.totalEvents,
          totalSubscribers: subscriberCount,
          eventTypes: Object.keys(stats.eventsByType).length,
          health: health.status,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }