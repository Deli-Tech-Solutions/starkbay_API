import { Module } from '@nestjs/common';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { SecurityService } from './services/security.service';
import { CsrfProtectionService } from './services/csrf-protection.service';
import { SqlInjectionGuard } from './guards/sql-injection.guard';
import { XssProtectionGuard } from './guards/xss-protection.guard';
import { SecurityLoggerService } from './services/security-logger.service';
import { SecurityController } from './security.controller';
import { APP_GUARD } from '@nestjs/core';
import { AuthenticatedRateLimitGuard } from './guards/authenticated-rate-limit.guard';

@Module({
  providers: [
    SecurityService,
    CsrfProtectionService,
    SecurityLoggerService,
    {
      provide: APP_GUARD,
      useClass: SqlInjectionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: XssProtectionGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthenticatedRateLimitGuard,
    },
  ],
  controllers: [SecurityController],
  exports: [
    SecurityService,
    CsrfProtectionService,
    SecurityLoggerService,
  ],
})
export class SecurityModule {} 