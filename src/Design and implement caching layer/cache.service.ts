// src/cache/cache.service.ts
import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    return this.cacheManager.wrap(key, fn, ttl);
  }

  async keys(pattern = '*'): Promise<string[]> {
    // Note: Not all cache stores support keys retrieval
    return this.cacheManager.store.keys ? this.cacheManager.store.keys(pattern) : [];
  }

  async getStats(): Promise<{ hits: number; misses: number; keys: number }> {
    const keys = await this.keys();
    return {
      hits: 0, // Most stores don't track this
      misses: 0, // Most stores don't track this
      keys: keys.length,
    };
  }

  async warmUp<T>(key: string, dataFetcher: () => Promise<T>, ttl?: number): Promise<void> {
    const data = await dataFetcher();
    await this.set(key, data, ttl);
  }
}