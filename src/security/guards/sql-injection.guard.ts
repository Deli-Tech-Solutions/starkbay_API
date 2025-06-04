import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from '../config/security.config';
import { SecurityLoggerService } from '../services/security-logger.service';

@Injectable()
export class SqlInjectionGuard implements CanActivate {
  private securityConfig: SecurityConfig;

  constructor(
    private configService: ConfigService,
    private securityLogger: SecurityLoggerService
  ) {
    this.securityConfig = this.configService.get<SecurityConfig>('security');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Skip validation for certain paths (like health checks)
    if (this.shouldSkipValidation(request.url)) {
      return true;
    }

    const payloads = this.extractPayloads(request);
    
    for (const payload of payloads) {
      if (this.containsSqlInjection(payload)) {
        this.securityLogger.logSqlInjectionAttempt(request, payload);
        throw new BadRequestException('Invalid input detected');
      }
    }

    return true;
  }

  private extractPayloads(request: any): string[] {
    const payloads: string[] = [];

    // Extract from query parameters
    if (request.query) {
      Object.values(request.query).forEach(value => {
        if (typeof value === 'string') {
          payloads.push(value);
        }
      });
    }

    // Extract from body
    if (request.body) {
      this.extractFromObject(request.body, payloads);
    }

    // Extract from params
    if (request.params) {
      Object.values(request.params).forEach(value => {
        if (typeof value === 'string') {
          payloads.push(value);
        }
      });
    }

    return payloads;
  }

  private extractFromObject(obj: any, payloads: string[], depth = 0): void {
    // Prevent deep object traversal
    if (depth > 5) return;

    if (typeof obj === 'string') {
      payloads.push(obj);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => {
        this.extractFromObject(value, payloads, depth + 1);
      });
    }
  }

  private containsSqlInjection(input: string): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }

    // Check input length
    if (input.length > this.securityConfig.inputValidation.maxInputLength) {
      return true;
    }

    // Check against SQL injection patterns
    return this.securityConfig.inputValidation.sqlInjectionPatterns.some(pattern => 
      pattern.test(input)
    );
  }

  private shouldSkipValidation(url: string): boolean {
    const skipPaths = [
      '/health',
      '/metrics',
      '/api/docs',
      '/swagger',
    ];

    return skipPaths.some(path => url.startsWith(path));
  }
} 