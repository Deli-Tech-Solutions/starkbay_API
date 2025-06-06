import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ArchiveMetadata } from './entities/archive-metadata.entity';
import { ArchiveJob } from './entities/archive-job.entity';
import { ArchiveService } from './services/archive.service';
import { ArchiveSchedulerService } from './services/archive-scheduler.service';
import { ArchiveController } from './controllers/archive.controller';
import archiveConfig from './config/archive.config';

@Module({
  imports: [
    ConfigModule.forFeature(archiveConfig),
    TypeOrmModule.forFeature([ArchiveMetadata, ArchiveJob]),
    ScheduleModule.forRoot(),
  ],
  providers: [ArchiveService, ArchiveSchedulerService],
  controllers: [ArchiveController],
  exports: [ArchiveService],
})
export class ArchiveModule {}
