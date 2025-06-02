import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class RateLimitHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();
    
    return next.handle().pipe(
      tap(() => {
        if (!response.getHeader('X-RateLimit-Limit')) {
          const timestamp = Math.floor(Date.now() / 1000);
          response.setHeader('X-RateLimit-Policy', 'default');
          response.setHeader('X-RateLimit-Applied', timestamp);
        }
      })
    );
  }
}
