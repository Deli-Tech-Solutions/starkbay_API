// src/cache/cache.decorators.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class CustomCacheInterceptor extends CacheInterceptor {
  constructor(
    cacheManager: any,
    reflector: Reflector,
  ) {
    super(cacheManager, reflector);
  }

  protected override trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, query, body } = request;
    
    // Custom cache key generation
    const prefix = this.reflector.get<string>('cache-key-prefix', context.getHandler()) || '';
    const ignoreParams = this.reflector.get<string[]>('cache-ignore-params', context.getHandler()) || [];
    
    // Filter out ignored params
    const filteredParams = { ...params };
    const filteredQuery = { ...query };
    ignoreParams.forEach(param => {
      delete filteredParams[param];
      delete filteredQuery[param];
    });
    
    return `${prefix}:${method}:${url}:${JSON.stringify(filteredParams)}:${JSON.stringify(filteredQuery)}`;
  }
}

// Decorator for cache invalidation
export function CacheInvalidate(keys: string | string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const cacheKeys = Array.isArray(keys) ? keys : [keys];

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      const cacheService: CacheService = this.cacheService;
      
      if (!cacheService) {
        throw new Error('CacheService not found. Make sure the class has CacheService injected');
      }

      await Promise.all(cacheKeys.map(key => cacheService.del(key)));
      return result;
    };

    return descriptor;
  };
}

// Decorator for manual caching
export function Cacheable(key: string, ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const cacheServiceName = 'cacheService';

    descriptor.value = async function (...args: any[]) {
      const cacheService: CacheService = this[cacheServiceName];
      
      if (!cacheService) {
        throw new Error('CacheService not found. Make sure the class has CacheService injected');
      }

      return cacheService.wrap(
        key,
        () => originalMethod.apply(this, args),
        ttl,
      );
    };

    return descriptor;
  };
}