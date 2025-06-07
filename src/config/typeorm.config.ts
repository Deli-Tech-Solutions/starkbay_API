import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();
const isProduction = configService.get<string>('NODE_ENV') === 'production';

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'postgres'),
  database: configService.get<string>('DB_NAME', 'starkbay'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // Always false for migrations
  logging: configService.get<boolean>('DB_LOGGING', !isProduction),
  extra: {
    ssl: isProduction ? {
      rejectUnauthorized: configService.get<boolean>('DB_SSL_REJECT_UNAUTHORIZED', true),
      ca: configService.get<string>('DB_SSL_CA'),
      cert: configService.get<string>('DB_SSL_CERT'),
      key: configService.get<string>('DB_SSL_KEY'),
    } : false,
  },
}); 