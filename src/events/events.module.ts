import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';

// Entities
import { EventStoreEntity } from './entities/event-store.entity';

// Services
import { CustomEventEmitterService } from './services/event-emitter.service';
import { EventStoreService } from './services/event-store.service';
import { EventMonitoringService } from './services/event-monitoring.service';
import { EventSubscriberService } from './services/event-subscriber.service';
import { EventReplayService } from './services/event-replay.service';
// Validators
import { EventPayloadValidator } from './validators/event-payload.validator';

// Controllers
import { EventsController } from './controllers/events.controller';

@Module({
    imports: [
      EventEmitterModule.forRoot({ /* configuration */ }),
      TypeOrmModule.forFeature([EventStoreEntity]),
      DiscoveryModule,
      ScheduleModule.forRoot(),
    ],
    providers: [
      CustomEventEmitterService,
      EventStoreService,
      EventMonitoringService,
      EventSubscriberService,
      EventReplayService,
      EventPayloadValidator,
    ],
    controllers: [EventsController],
    exports: [],
  })
  export class EventsModule {}