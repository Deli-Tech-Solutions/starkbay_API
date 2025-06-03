// src/common/interceptors/deprecation.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class DeprecationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (req.apiVersion === 'v1') {
      context.switchToHttp().getResponse().setHeader(
        'X-Deprecation-Notice',
        'API v1 will be deprecated by 2025-12-31. Please migrate to v2.'
      );
    }
    return next.handle();
  }
}
