import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { SecurityConfig } from '../config/security.config';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private securityConfig: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.securityConfig = this.configService.get<SecurityConfig>('security');
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      this.securityConfig.headers.contentSecurityPolicy
    );

    // X-XSS-Protection
    if (this.securityConfig.headers.xssProtection) {
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }

    // X-Frame-Options
    res.setHeader('X-Frame-Options', this.securityConfig.headers.frameOptions);

    // X-Content-Type-Options
    if (this.securityConfig.headers.contentTypeOptions) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // Referrer-Policy
    res.setHeader('Referrer-Policy', this.securityConfig.headers.referrerPolicy);

    // Strict-Transport-Security (HSTS)
    const hsts = this.securityConfig.headers.hsts;
    let hstsValue = `max-age=${hsts.maxAge}`;
    if (hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    if (hsts.preload) {
      hstsValue += '; preload';
    }
    res.setHeader('Strict-Transport-Security', hstsValue);

    // Additional security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

    // Remove server identification
    res.removeHeader('X-Powered-By');

    next();
  }
} 