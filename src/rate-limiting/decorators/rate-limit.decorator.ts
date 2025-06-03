import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from '../interfaces/rate-limit.interface';

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (config: RateLimitConfig) => 
  SetMetadata(RATE_LIMIT_KEY, config);

export const StrictRateLimit = (ttl: number = 60, limit: number = 10) =>
  RateLimit({ ttl, limit, type: 'strict' });

export const ModerateRateLimit = (ttl: number = 60, limit: number = 50) =>
  RateLimit({ ttl, limit, type: 'moderate' });

export const LenientRateLimit = (ttl: number = 60, limit: number = 100) =>
  RateLimit({ ttl, limit, type: 'lenient' });
