import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationService } from './migration.service';
import { MigrationTestService } from './migration-test.service';
import { MigrationDependencyService } from './migration-dependency.service';
import { MigrationController } from './migration.controller';
import { SchemaVersion } from '../notification/entities/schema-version.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SchemaVersion])],
  providers: [
    MigrationService,
    MigrationTestService,
    MigrationDependencyService,
  ],
  controllers: [MigrationController],
  exports: [
    MigrationService,
    MigrationTestService,
    MigrationDependencyService,
  ],
})
export class MigrationModule {}
