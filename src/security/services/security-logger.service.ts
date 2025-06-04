import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from '../config/security.config';

export interface SecurityEvent {
  type: 'SQL_INJECTION' | 'XSS_ATTEMPT' | 'CSRF_VIOLATION' | 'RATE_LIMIT_EXCEEDED' | 'AUTHENTICATION_FAILURE';
  timestamp: Date;
  ip: string;
  userAgent?: string;
  url: string;
  method: string;
  payload?: string;
  userId?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class SecurityLoggerService {
  private readonly logger = new Logger(SecurityLoggerService.name);
  private securityConfig: SecurityConfig;
  private eventCounts = new Map<string, number>();

  constructor(private configService: ConfigService) {
    this.securityConfig = this.configService.get<SecurityConfig>('security');
  }

  logSqlInjectionAttempt(request: any, payload: string): void {
    const event: SecurityEvent = {
      type: 'SQL_INJECTION',
      timestamp: new Date(),
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      url: request.url,
      method: request.method,
      payload: this.sanitizeForLogging(payload),
      severity: 'HIGH',
    };

    this.logSecurityEvent(event);
    this.checkForAlerts('SQL_INJECTION', event.ip);
  }

  logXssAttempt(request: any, payload: string): void {
    const event: SecurityEvent = {
      type: 'XSS_ATTEMPT',
      timestamp: new Date(),
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      url: request.url,
      method: request.method,
      payload: this.sanitizeForLogging(payload),
      severity: 'HIGH',
    };

    this.logSecurityEvent(event);
    this.checkForAlerts('XSS_ATTEMPT', event.ip);
  }

  logCsrfViolation(request: any): void {
    const event: SecurityEvent = {
      type: 'CSRF_VIOLATION',
      timestamp: new Date(),
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      url: request.url,
      method: request.method,
      severity: 'MEDIUM',
    };

    this.logSecurityEvent(event);
  }

  logRateLimitExceeded(request: any, userId?: string): void {
    const event: SecurityEvent = {
      type: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date(),
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      url: request.url,
      method: request.method,
      userId,
      severity: 'MEDIUM',
    };

    this.logSecurityEvent(event);
  }

  logAuthenticationFailure(request: any, userId?: string): void {
    const event: SecurityEvent = {
      type: 'AUTHENTICATION_FAILURE',
      timestamp: new Date(),
      ip: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      url: request.url,
      method: request.method,
      userId,
      severity: 'MEDIUM',
    };

    this.logSecurityEvent(event);
    this.checkForAlerts('AUTHENTICATION_FAILURE', event.ip);
  }

  private logSecurityEvent(event: SecurityEvent): void {
    if (!this.securityConfig.logging.logSecurityEvents) {
      return;
    }

    const logMessage = `Security Event: ${event.type} from ${event.ip} on ${event.url}`;
    const logData = {
      ...event,
      payload: event.payload ? '[REDACTED]' : undefined,
    };

    switch (event.severity) {
      case 'CRITICAL':
        this.logger.error(logMessage, logData);
        break;
      case 'HIGH':
        this.logger.warn(logMessage, logData);
        break;
      case 'MEDIUM':
        this.logger.warn(logMessage, logData);
        break;
      case 'LOW':
        this.logger.log(logMessage, logData);
        break;
    }
  }

  private checkForAlerts(eventType: string, ip: string): void {
    const key = `${eventType}:${ip}`;
    const count = (this.eventCounts.get(key) || 0) + 1;
    this.eventCounts.set(key, count);

    // Clean up old entries every 1000 events
    if (this.eventCounts.size > 1000) {
      this.eventCounts.clear();
    }

    // Check thresholds
    const threshold = eventType === 'AUTHENTICATION_FAILURE' 
      ? this.securityConfig.logging.alertThresholds.failedLogins
      : this.securityConfig.logging.alertThresholds.suspiciousPatterns;

    if (count >= threshold) {
      this.logger.error(`SECURITY ALERT: ${eventType} threshold exceeded for IP ${ip}. Count: ${count}`);
      // Here you could integrate with external alerting systems
    }
  }

  private getClientIP(request: any): string {
    return request.ip || 
           request.connection?.remoteAddress || 
           request.headers['x-forwarded-for']?.split(',')[0] || 
           'unknown';
  }

  private sanitizeForLogging(payload: string): string {
    // Truncate and remove sensitive patterns for logging
    const truncated = payload.substring(0, 200);
    return truncated.replace(/[<>\"']/g, '[FILTERED]');
  }
} 