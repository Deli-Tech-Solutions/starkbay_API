// src/cache/cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { CacheService } from './cache.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: async () => {
          if (configService.get('REDIS_ENABLED') === 'true') {
            return await redisStore({
              socket: {
                host: configService.get('REDIS_HOST'),
                port: +configService.get('REDIS_PORT'),
              },
              ttl: +configService.get('CACHE_TTL') || 30, // default 30 seconds
            });
          }
          return 'memory'; // fallback to in-memory cache
        },
        ttl: +configService.get('CACHE_TTL') || 30,
        max: configService.get('CACHE_MAX_ITEMS') || 100,
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}