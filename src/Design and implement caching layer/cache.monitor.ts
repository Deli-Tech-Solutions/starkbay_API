// src/cache/cache.monitor.ts
import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';

@Injectable()
export class CacheMonitorService {
  constructor(private readonly cacheService: CacheService) {}

  async getCacheStats() {
    return this.cacheService.getStats();
  }

  async getCacheKeys(pattern = '*'): Promise<string[]> {
    return this.cacheService.keys(pattern);
  }

  async getCacheValue<T>(key: string): Promise<{ key: string; value: T | null }> {
    const value = await this.cacheService.get<T>(key);
    return { key, value: value || null };
  }
}