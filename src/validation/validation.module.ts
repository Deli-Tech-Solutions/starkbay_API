import { Module, Global } from '@nestjs/common';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { GlobalValidationPipe } from './pipes/global-validation.pipe';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';
import { SanitizationService } from './services/sanitization.service';
import { ValidationCacheService } from './services/validation-cache.service';
import { ValidationErrorFormatterService } from './services/validation-error-formatter.service';
import { ValidationOptions } from './interfaces/validation.interface';
import { VALIDATION_CACHE_TTL } from './constants/validation.constants';

@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: VALIDATION_CACHE_TTL,
      max: 1000, // Maximum number of cached items
    }),
  ],
  providers: [
    SanitizationService,
    ValidationCacheService,
    ValidationErrorFormatterService,
    {
      provide: APP_PIPE,
      useFactory: (
        errorFormatter: ValidationErrorFormatterService,
        sanitizationService: SanitizationService,
        cacheService: ValidationCacheService
      ) => {
        const options: ValidationOptions = {
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          sanitize: true,
        };
        
        return new GlobalValidationPipe(
          errorFormatter,
          sanitizationService,
          cacheService,
          options
        );
      },
      inject: [
        ValidationErrorFormatterService,
        SanitizationService,
        ValidationCacheService,
      ],
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
  exports: [
    SanitizationService,
    ValidationCacheService,
    ValidationErrorFormatterService,
  ],
})
export class ValidationModule {}

