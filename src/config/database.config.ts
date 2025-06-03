import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
  synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
  logging: configService.get<boolean>('DB_LOGGING', false),
  retryAttempts: 3,
  retryDelay: 3000,
  autoLoadEntities: true,
  extra: {
    // Connection pool configuration
    max: configService.get<number>('DB_POOL_MAX', 20),
    min: configService.get<number>('DB_POOL_MIN', 5),
    idle: configService.get<number>('DB_POOL_IDLE', 10000),
    acquire: configService.get<number>('DB_POOL_ACQUIRE', 30000),
    // Enable prepared statements for better performance
    statement_timeout: configService.get<number>('DB_STATEMENT_TIMEOUT', 30000),
    query_timeout: configService.get<number>('DB_QUERY_TIMEOUT', 30000),
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    // Enable deadlock detection
    enableArithAbort: true,
  },
});
