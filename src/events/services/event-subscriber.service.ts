import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENT_SUBSCRIBER_METADATA, EventSubscriberOptions } from '../decorators/event-subscriber.decorator';
import { EventPayload } from '../types/event.types';
import { EventMonitoringService } from './event-monitoring.service';
import { EventStoreService } from './event-store.service';

interface RegisteredSubscriber {
  instance: any;
  methodName: string;
  options: EventSubscriberOptions;
}

@Injectable()
export class EventSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(EventSubscriberService.name);
  private readonly subscribers = new Map<string, RegisteredSubscriber[]>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventMonitoring: EventMonitoringService,
    private readonly eventStore: EventStoreService
  ) {}

  onModuleInit() {
    this.discoverEventSubscribers();
    this.registerEventListeners();
  }

  private discoverEventSubscribers(): void {
    const providers = this.discoveryService.getProviders();

    providers.forEach(wrapper => {
      const { instance } = wrapper;
      if (!instance) return;

      const prototype = Object.getPrototypeOf(instance);
      const methodNames = Object.getOwnPropertyNames(prototype).filter(
        name => name !== 'constructor' && typeof prototype[name] === 'function'
      );

      methodNames.forEach(methodName => {
        const metadata = this.reflector.get<EventSubscriberOptions>(
          EVENT_SUBSCRIBER_METADATA,
          prototype[methodName]
        );

        if (metadata) {
          this.registerSubscriber(instance, methodName, metadata);
        }
      });
    });

    this.logger.log(`Discovered ${this.getTotalSubscriberCount()} event subscribers`);
  }

  private registerSubscriber(
    instance: any,
    methodName: string,
    options: EventSubscriberOptions
  ): void {
    const subscribers = this.subscribers.get(options.eventType) || [];
    subscribers.push({ instance, methodName, options });
    
    // Sort by priority (higher priority first)
    subscribers.sort((a, b) => b.options.priority - a.options.priority);
    
    this.subscribers.set(options.eventType, subscribers);

    this.logger.debug(
      `Registered subscriber: ${instance.constructor.name}.${methodName} for ${options.eventType}`
    );
  }

  private registerEventListeners(): void {
    this.subscribers.forEach((subscribers, eventType) => {
      this.eventEmitter.on(eventType, async (event: EventPayload) => {
        await this.handleEvent(eventType, event, subscribers);
      });
    });
  }

  private async handleEvent(
    eventType: string,
    event: EventPayload,
    subscribers: RegisteredSubscriber[]
  ): Promise<void> {
    this.logger.debug(`Handling event: ${eventType} with ${subscribers.length} subscribers`);

    for (const subscriber of subscribers) {
      await this.executeSubscriber(subscriber, event);
    }
  }

  private async executeSubscriber(
    subscriber: RegisteredSubscriber,
    event: EventPayload
  ): Promise<void> {
    const startTime = Date.now();
    const { instance, methodName, options } = subscriber;

    try {
      if (options.async) {
        // Execute asynchronously
        setImmediate(async () => {
          await this.executeWithRetry(instance, methodName, event, options.retries);
        });
      } else {
        // Execute synchronously
        await this.executeWithRetry(instance, methodName, event, options.retries);
      }

      const processingTime = Date.now() - startTime;
      await this.eventMonitoring.trackEventProcessing(event.type, processingTime);
      await this.eventStore.markEventAsProcessed(event.id);

      this.logger.debug(
        `Subscriber executed: ${instance.constructor.name}.${methodName} (${processingTime}ms)`
      );

    } catch (error) {
      this.logger.error(
        `Subscriber failed: ${instance.constructor.name}.${methodName}`,
        error.stack
      );

      await this.eventMonitoring.trackEventError(event, error);
      await this.eventStore.markEventAsFailed(event.id, error.message);
    }
  }

  private async executeWithRetry(
    instance: any,
    methodName: string,
    event: EventPayload,
    maxRetries: number,
    attempt = 1
  ): Promise<void> {
    try {
      await instance[methodName](event);
    } catch (error) {
      if (attempt < maxRetries) {
        this.logger.warn(
          `Retrying subscriber: ${instance.constructor.name}.${methodName} (attempt ${attempt + 1}/${maxRetries})`
        );
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await this.sleep(delay);
        
        return this.executeWithRetry(instance, methodName, event, maxRetries, attempt + 1);
      }
      
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSubscribersForEvent(eventType: string): RegisteredSubscriber[] {
    return this.subscribers.get(eventType) || [];
  }

  getAllSubscribers(): Map<string, RegisteredSubscriber[]> {
    return this.subscribers;
  }

  private getTotalSubscriberCount(): number {
    let total = 0;
    this.subscribers.forEach(subscribers => {
      total += subscribers.length;
    });
    return total;
  }
}