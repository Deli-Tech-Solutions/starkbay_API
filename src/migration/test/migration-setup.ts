import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MigrationModule } from '../src/migration/migration.module';
import { getDatabaseConfig } from '../src/config/database.config';
import { ConfigService } from '@nestjs/config';

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [
      TypeOrmModule.forRootAsync({
        useFactory: () => ({
          ...getDatabaseConfig(new ConfigService()),
          database: 'test_migration_db',
          synchronize: false,
          dropSchema: true,
        }),
      }),
      MigrationModule,
    ],
  }).compile();

  global.testModule = moduleRef;
});

afterAll(async () => {
  if (global.testModule) {
    await global.testModule.close();
  }
});
