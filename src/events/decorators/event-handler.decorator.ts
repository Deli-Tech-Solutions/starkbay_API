import { SetMetadata } from '@nestjs/common';

export const EVENT_HANDLER_METADATA = 'event_handler_metadata';

export interface EventHandlerOptions {
  async?: boolean;
  timeout?: number;
  retries?: number;
}

export const EventHandler = (eventType: string, options: EventHandlerOptions = {}) => {
  return SetMetadata(EVENT_HANDLER_METADATA, {
    eventType,
    async: options.async ?? true,
    timeout: options.timeout ?? 30000,
    retries: options.retries ?? 3
  });
};