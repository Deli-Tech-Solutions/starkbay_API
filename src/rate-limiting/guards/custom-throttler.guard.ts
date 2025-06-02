import { 
  Injectable, 
  ExecutionContext, 
  HttpException, 
  HttpStatus,
  Inject
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { Request, Response } from 'express';
import rateLimitConfig from '../../config/rate-limit.config';
import { RateLimitService } from '../services/rate-limit.service';
import { RateLimitAnalyticsService } from '../services/rate-limit-analytics.service';
import { RATE_LIMIT_KEY } from '../decorators/rate-limit.decorator';
import { RateLimitConfig } from '../interfaces/rate-limit.interface';

@Injectable()
export class CustomThrottlerGuard {
  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService,
    private analyticsService: RateLimitAnalyticsService,
    @Inject(rateLimitConfig.KEY)
    private config: ConfigType<typeof rateLimitConfig>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    const bypassRateLimit = this.reflector.getAllAndOverride<boolean>(
      BYPASS_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (bypassRateLimit) {
      return true;
    }

    const trustedClient = this.checkTrustedClient(request);
    if (trustedClient && this.rateLimitService.canBypassRateLimit(trustedClient, request.path)) {
      return true;
    }

    const rateLimitConfig = this.getRateLimitConfig(context, request);
    
    if (rateLimitConfig.skipIf && rateLimitConfig.skipIf(context)) {
      return true;
    }

    const ip = this.getClientIp(request);
    const userId = this.getUserId(request);

    const ipResult = await this.rateLimitService.checkIpRateLimit(
      request.path,
      ip,
      rateLimitConfig.ttl,
      rateLimitConfig.limit
    );

    let userResult: import('../interfaces/rate-limit.interface').RateLimitResponse | null = null;
    if (userId) {
      userResult = await this.rateLimitService.checkUserRateLimit(
        request.path,
        userId,
        rateLimitConfig.ttl,
        rateLimitConfig.limit
      );
    }

    const rateLimited = !ipResult.success || (userResult ? !userResult.success : false);
    const result = userResult || ipResult;

    this.analyticsService.recordRequest({
      endpoint: request.path,
      ip,
      userId,
      timestamp: new Date(),
      rateLimited: !!rateLimited,
      requestCount: rateLimitConfig.limit - result.remaining
    });

    this.setRateLimitHeaders(response, result, rateLimitConfig);

    if (rateLimited) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          error: 'Rate limit exceeded',
          retryAfter: result.retryAfter
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private checkTrustedClient(request: Request) {
    const apiKey = request.headers['x-api-key'] as string;
    return apiKey ? this.rateLimitService.isTrustedClient(apiKey) : null;
  }

  private getRateLimitConfig(context: ExecutionContext, request: Request): RateLimitConfig {
    const decoratorConfig = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (decoratorConfig) {
      return decoratorConfig;
    }

    const endpointConfig = this.config.endpointLimits[request.path];
    if (endpointConfig) {
      return endpointConfig;
    }

    return this.config.defaultLimits.moderate;
  }

  private getClientIp(request: Request): string {
    return (
      request.headers['x-forwarded-for'] as string ||
      request.headers['x-real-ip'] as string ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      '127.0.0.1'
    ).split(',')[0].trim();
  }

  private getUserId(request: Request): string | undefined {
    return (request as any).user?.id || (request as any).user?.sub;
  }

  private setRateLimitHeaders(
    response: Response,
    result: any,
    config: RateLimitConfig
  ): void {
    response.setHeader('X-RateLimit-Limit', config.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000));
    
    if (result.retryAfter) {
      response.setHeader('Retry-After', result.retryAfter);
    }
  }
}
