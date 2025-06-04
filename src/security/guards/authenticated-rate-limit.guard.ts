import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from '../config/security.config';
import { SecurityLoggerService } from '../services/security-logger.service';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class AuthenticatedRateLimitGuard implements CanActivate {
  private securityConfig: SecurityConfig;
  private limitStore = new Map<string, RateLimitEntry>();

  constructor(
    private configService: ConfigService,
    private securityLogger: SecurityLoggerService
  ) {
    this.securityConfig = this.configService.get<SecurityConfig>('security');
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanupExpiredEntries(), 5 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Skip rate limiting for certain paths
    if (this.shouldSkipRateLimit(request.url)) {
      return true;
    }

    const key = this.generateKey(request);
    const limit = this.getLimit(request);
    const windowMs = this.getWindow(request);

    if (this.isRateLimited(key, limit, windowMs)) {
      this.securityLogger.logRateLimitExceeded(request, request.user?.id);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          error: 'Rate limit exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private generateKey(request: any): string {
    // Use user ID if authenticated, otherwise fallback to IP
    const userId = request.user?.id;
    const ip = this.getClientIP(request);
    
    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  private getLimit(request: any): number {
    // Different limits for different endpoints
    if (this.isLoginEndpoint(request.url)) {
      return this.securityConfig.rateLimit.login.max;
    }
    
    return this.securityConfig.rateLimit.authenticated.max;
  }

  private getWindow(request: any): number {
    // Different windows for different endpoints
    if (this.isLoginEndpoint(request.url)) {
      return this.securityConfig.rateLimit.login.windowMs;
    }
    
    return this.securityConfig.rateLimit.authenticated.windowMs;
  }

  private isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window has expired
      this.limitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return false;
    }

    if (entry.count >= limit) {
      return true;
    }

    // Increment count
    entry.count++;
    this.limitStore.set(key, entry);
    return false;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.limitStore.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.limitStore.delete(key));
  }

  private shouldSkipRateLimit(url: string): boolean {
    const skipPaths = [
      '/health',
      '/metrics',
      '/api/docs',
      '/swagger',
    ];

    return skipPaths.some(path => url.startsWith(path));
  }

  private isLoginEndpoint(url: string): boolean {
    const loginPaths = [
      '/auth/login',
      '/auth/signin',
      '/api/auth/login',
      '/api/v1/auth/login',
      '/api/v2/auth/login',
    ];

    return loginPaths.some(path => url.includes(path));
  }

  private getClientIP(request: any): string {
    return request.ip || 
           request.connection?.remoteAddress || 
           request.headers['x-forwarded-for']?.split(',')[0] || 
           'unknown';
  }

  // Method to get current rate limit status (useful for debugging)
  getRateLimitStatus(key: string): { count: number; resetTime: number; remaining: number } | null {
    const entry = this.limitStore.get(key);
    if (!entry) {
      return null;
    }

    const limit = this.securityConfig.rateLimit.authenticated.max;
    return {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, limit - entry.count)
    };
  }
} 