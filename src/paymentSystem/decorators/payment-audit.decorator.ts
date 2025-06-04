import { SetMetadata } from '@nestjs/common';

export const PAYMENT_AUDIT_KEY = 'paymentAudit';
export const PaymentAudit = (action: string) => SetMetadata(PAYMENT_AUDIT_KEY, action);

// paymentSystem/interceptors/payment-audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PAYMENT_AUDIT_KEY } from '../decorators/payment-audit.decorator';

@Injectable()
export class PaymentAuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditAction = this.reflector.get<string>(PAYMENT_AUDIT_KEY, context.getHandler());
    
    if (!auditAction) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          this.logPaymentAudit({
            action: auditAction,
            userId: request.user?.id,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            duration: Date.now() - startTime,
            success: true,
            data: this.sanitizeAuditData(data)
          });
        },
        error: (error) => {
          this.logPaymentAudit({
            action: auditAction,
            userId: request.user?.id,
            ip: request.ip,
            userAgent: request.headers['user-agent'],
            duration: Date.now() - startTime,
            success: false,
            error: error.message
          });
        }
      })
    );
  }

  private logPaymentAudit(auditData: any): void {
    // Log to audit system
    console.log('Payment Audit:', JSON.stringify(auditData, null, 2));
  }

  private sanitizeAuditData(data: any): any {
    // Remove sensitive information from audit logs
    if (data && typeof data === 'object') {
      const sanitized = { ...data };
      delete sanitized.transactionId;
      delete sanitized.metadata;
      return sanitized;
    }
    return data;
  }
}