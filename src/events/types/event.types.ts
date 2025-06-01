export interface BaseEvent {
    id: string;
    timestamp: Date;
    version: string;
    aggregateId?: string;
    userId?: string;
    correlationId?: string;
    causationId?: string;
    metadata?: Record<string, any>;
  }
  
  export interface EventPayload extends BaseEvent {
    type: string;
    data: any;
  }
  
  export interface EventSubscriberMetadata {
    eventType: string;
    handler: string;
    async: boolean;
    retries: number;
    priority: number;
  }
  
  export interface EventStore {
    id: string;
    eventType: string;
    aggregateId: string;
    version: string;
    payload: any;
    metadata: Record<string, any>;
    createdAt: Date;
    processedAt?: Date;
    status: EventStatus;
  }
  
  export enum EventStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    RETRY = 'retry'
  }
  
  export interface EventReplayOptions {
    fromDate?: Date;
    toDate?: Date;
    eventTypes?: string[];
    aggregateIds?: string[];
    version?: string;
    batchSize?: number;
  }