import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import rateLimitConfig from '../../config/rate-limit.config';
import { RateLimitResponse, TrustedClient } from '../interfaces/rate-limit.interface';

@Injectable()
export class RateLimitService {
  private redis: Redis;

  constructor(
    @Inject(rateLimitConfig.KEY)
    private config: ConfigType<typeof rateLimitConfig>
  ) {
    this.redis = new Redis(this.config.redis);
  }

  async checkRateLimit(
    key: string,
    ttl: number,
    limit: number,
    identifier?: string
  ): Promise<RateLimitResponse> {
    const fullKey = identifier ? `${key}:${identifier}` : key;
    
    const current = await this.redis.get(fullKey);
    const currentCount = current ? parseInt(current) : 0;

    if (currentCount >= limit) {
      const remainingTtl = await this.redis.ttl(fullKey);
      return {
        success: false,
        remaining: 0,
        resetTime: Date.now() + (remainingTtl * 1000),
        retryAfter: remainingTtl
      };
    }

    const pipeline = this.redis.pipeline();
    pipeline.incr(fullKey);
    pipeline.expire(fullKey, ttl);
    await pipeline.exec();

    return {
      success: true,
      remaining: limit - currentCount - 1,
      resetTime: Date.now() + (ttl * 1000)
    };
  }

  async checkUserRateLimit(
    endpoint: string,
    userId: string,
    ttl: number,
    limit: number
  ): Promise<RateLimitResponse> {
    const key = `user_rate_limit:${endpoint}`;
    return this.checkRateLimit(key, ttl, limit, userId);
  }

  async checkIpRateLimit(
    endpoint: string,
    ip: string,
    ttl: number,
    limit: number
  ): Promise<RateLimitResponse> {
    const key = `ip_rate_limit:${endpoint}`;
    return this.checkRateLimit(key, ttl, limit, ip);
  }

  isTrustedClient(apiKey: string): TrustedClient | null {
    return this.config.trustedClients.find(client => client.apiKey === apiKey) || null;
  }

  canBypassRateLimit(trustedClient: TrustedClient, endpoint: string): boolean {
    if (trustedClient.bypassAll) {
      return true;
    }
    
    return trustedClient.allowedEndpoints?.includes(endpoint) || false;
  }

  async getRateLimitStatus(key: string, identifier?: string): Promise<{
    current: number;
    limit: number;
    resetTime: number;
  }> {
    const fullKey = identifier ? `${key}:${identifier}` : key;
    const current = await this.redis.get(fullKey);
    const ttl = await this.redis.ttl(fullKey);
    
    return {
      current: current ? parseInt(current) : 0,
      limit: 0,
      resetTime: Date.now() + (ttl * 1000)
    };
  }

  async clearRateLimit(key: string, identifier?: string): Promise<void> {
    const fullKey = identifier ? `${key}:${identifier}` : key;
    await this.redis.del(fullKey);
  }
}
