import { SetMetadata } from '@nestjs/common';

export const EVENT_SUBSCRIBER_METADATA = 'event_subscriber_metadata';

export interface EventSubscriberOptions {
  eventType: string;
  async?: boolean;
  retries?: number;
  priority?: number;
  version?: string;
}

export const EventSubscriber = (options: EventSubscriberOptions) => {
  return SetMetadata(EVENT_SUBSCRIBER_METADATA, {
    eventType: options.eventType,
    async: options.async ?? true,
    retries: options.retries ?? 3,
    priority: options.priority ?? 0,
    version: options.version ?? '1.0.0'
  });
};