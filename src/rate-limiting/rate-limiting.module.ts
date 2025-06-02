import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import rateLimitConfig from '../config/rate-limit.config';
import { RateLimitService } from './services/rate-limit.service';
import { RateLimitAnalyticsService } from './services/rate-limit-analytics.service';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { TrustedClientGuard } from './guards/trusted-client.guard';
import { RateLimitHeadersInterceptor } from './interceptors/rate-limit-headers.interceptor';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(rateLimitConfig)
  ],
  providers: [
    RateLimitService,
    RateLimitAnalyticsService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitHeadersInterceptor,
    },
    TrustedClientGuard
  ],
  exports: [
    RateLimitService,
    RateLimitAnalyticsService,
    TrustedClientGuard
  ]
})
export class RateLimitingModule {}
