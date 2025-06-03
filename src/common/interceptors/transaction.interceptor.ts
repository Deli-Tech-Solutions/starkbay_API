import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, firstValueFrom } from 'rxjs';
import { TRANSACTIONAL_KEY } from '../decorators/transactional.decorator';
import { TransactionConfig } from '../types/transaction.types';
import { TransactionManagerService } from 'src/transaction/services/transaction-manager.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly transactionManager: TransactionManagerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const transactionConfig = this.reflector.get<TransactionConfig>(
      TRANSACTIONAL_KEY,
      context.getHandler(),
    );

    if (!transactionConfig) {
      return next.handle();
    }

    // Convert Observable to Promise for transaction handling
    return new Observable((observer) => {
      this.transactionManager
        .executeTransaction<any>(async (queryRunner) => {
          // Add queryRunner to request context
          const request = context.switchToHttp().getRequest();
          request.queryRunner = queryRunner;

          // Execute the original method
          return firstValueFrom(next.handle());
        }, transactionConfig)
        .then((result) => {
          observer.next(result);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
}
