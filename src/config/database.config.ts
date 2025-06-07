import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'starkbay'),
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    synchronize: !isProduction,
    logging: configService.get<boolean>('DB_LOGGING', !isProduction),
    retryAttempts: 3,
    retryDelay: 3000,
    autoLoadEntities: false, // Using manual entity registration
    migrationsRun: isProduction, // Auto-run migrations in production
    cli: {
      migrationsDir: 'src/migrations',
    },
    extra: {
      // Connection pool configuration
      max: configService.get<number>('DB_POOL_MAX', isProduction ? 20 : 10),
      min: configService.get<number>('DB_POOL_MIN', isProduction ? 5 : 2),
      idle: configService.get<number>('DB_POOL_IDLE', 10000),
      acquire: configService.get<number>('DB_POOL_ACQUIRE', 30000),
      // Performance settings
      statement_timeout: configService.get<number>('DB_STATEMENT_TIMEOUT', 30000),
      query_timeout: configService.get<number>('DB_QUERY_TIMEOUT', 30000),
      connectionLimit: configService.get<number>('DB_CONNECTION_LIMIT', isProduction ? 20 : 10),
      acquireTimeout: 60000,
      timeout: 60000,
      // SSL configuration for production
      ssl: isProduction ? {
        rejectUnauthorized: configService.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED', true),
        ca: configService.get<string>('DB_SSL_CA'),
        cert: configService.get<string>('DB_SSL_CERT'),
        key: configService.get<string>('DB_SSL_KEY'),
      } : false,
    },
  };
};
