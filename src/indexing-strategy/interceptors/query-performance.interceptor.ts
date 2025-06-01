import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { Reflector } from '@nestjs/core';
  import { MONITOR_INDEX_KEY, IndexMonitoringOptions } from '../decorators/index-monitoring.decorator';
  
  @Injectable()
  export class QueryPerformanceInterceptor implements NestInterceptor {
    private readonly logger = new Logger(QueryPerformanceInterceptor.name);
  
    constructor(private reflector: Reflector) {}
  
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      const monitoringOptions = this.reflector.get<IndexMonitoringOptions>(
        MONITOR_INDEX_KEY,
        context.getHandler(),
      );
  
      if (!monitoringOptions?.enabled) {
        return next.handle();
      }
  
      const startTime = Date.now();
      const className = context.getClass().name;
      const methodName = context.getHandler().name;
  
      return next.handle().pipe(
        tap(() => {
          const executionTime = Date.now() - startTime;
          
          if (executionTime > (monitoringOptions.threshold || 100)) {
            this.logger.warn(
              `Slow query detected in ${className}.${methodName}: ${executionTime}ms`,
              {
                class: className,
                method: methodName,
                executionTime,
                table: monitoringOptions.tableName,
              }
            );
          }
        }),
      );
    }
  }