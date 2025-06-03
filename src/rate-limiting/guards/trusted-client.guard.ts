import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RateLimitService } from '../services/rate-limit.service';

@Injectable()
export class TrustedClientGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rateLimitService: RateLimitService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const trustedOnly = this.reflector.getAllAndOverride<boolean>('trusted_only', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!trustedOnly) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const trustedClient = this.rateLimitService.isTrustedClient(apiKey);
    if (!trustedClient) {
      throw new UnauthorizedException('Invalid API key');
    }

    (request as any).trustedClient = trustedClient;
    return true;
  }
}
