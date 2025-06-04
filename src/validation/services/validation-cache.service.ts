import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ValidationResult, CacheOptions } from '../interfaces/validation.interface';
import { VALIDATION_CACHE_TTL } from '../constants/validation.constants';

@Injectable()
export class ValidationCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getCachedValidation(key: string): Promise<ValidationResult | null> {
    try {
      return await this.cacheManager.get<ValidationResult>(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCachedValidation(
    key: string, 
    result: ValidationResult, 
    options?: CacheOptions
  ): Promise<void> {
    try {
      const ttl = options?.ttl || VALIDATION_CACHE_TTL;
      await this.cacheManager.set(key, result, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  generateCacheKey(data: any, validationOptions?: any): string {
    const dataHash = this.hashObject(data);
    const optionsHash = this.hashObject(validationOptions || {});
    return `validation:${dataHash}:${optionsHash}`;
  }

  private hashObject(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString('base64');
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Implementation depends on your cache provider
    // For Redis: await this.cacheManager.store.keys(pattern)
    // then delete matching keys
  }
}