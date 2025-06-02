import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TransactionLoggerService } from './transaction-logger.service';
import {
  TransactionConfig,
  TransactionContext,
  DeadlockDetectionResult,
} from 'src/common/types/transaction.types';

@Injectable()
export class TransactionManagerService {
  private readonly logger = new Logger(TransactionManagerService.name);
  private readonly activeTransactions = new Map<string, QueryRunner>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly transactionLogger: TransactionLoggerService,
  ) {}

  async executeTransaction<T>(
    operation: (queryRunner: QueryRunner) => Promise<T>,
    config: TransactionConfig = {},
  ): Promise<T> {
    const transactionId = uuidv4();
    const startTime = new Date();

    const context: TransactionContext = {
      id: transactionId,
      startTime,
      isolationLevel: config.isolationLevel || 'READ COMMITTED',
      operations: [],
      metadata: config,
    };

    let queryRunner: QueryRunner | null = null;
    let retryCount = 0;
    const maxRetries = config.retryAttempts || 3;

    while (retryCount <= maxRetries) {
      try {
        queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        // Set isolation level if specified
        if (config.isolationLevel) {
          await queryRunner.query(
            `SET TRANSACTION ISOLATION LEVEL ${config.isolationLevel}`,
          );
        }

        await queryRunner.startTransaction();
        this.activeTransactions.set(transactionId, queryRunner);

        // Log transaction start
        if (config.enableLogging !== false) {
          await this.transactionLogger.logTransactionStart(context);
        }

        // Set transaction timeout if specified
        if (config.timeout) {
          setTimeout(() => {
            void this.handleTransactionTimeout(transactionId);
          }, config.timeout);
        }

        // Execute the operation
        const result = await operation(queryRunner);

        // Commit transaction
        await queryRunner.commitTransaction();

        const duration = Date.now() - startTime.getTime();

        // Log successful transaction
        if (config.enableLogging !== false) {
          await this.transactionLogger.logTransactionEnd(
            transactionId,
            true,
            duration,
          );
        }

        this.logger.debug(
          `Transaction ${transactionId} committed successfully in ${duration}ms`,
        );

        return result;
      } catch (error) {
        const duration = Date.now() - startTime.getTime();

        // Check if it's a deadlock
        const deadlockResult = this.detectDeadlock(error);

        if (queryRunner && queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }

        // Log failed transaction
        if (config.enableLogging !== false) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          await this.transactionLogger.logTransactionEnd(
            transactionId,
            false,
            duration,
            errorMessage,
          );
        }

        // Handle deadlock retry
        if (
          deadlockResult.isDeadlock &&
          deadlockResult.shouldRetry &&
          retryCount < maxRetries
        ) {
          retryCount++;
          this.logger.warn(
            `Deadlock detected for transaction ${transactionId}. Retrying (${retryCount}/${maxRetries})`,
          );

          // Wait before retry
          if (deadlockResult.retryAfter > 0) {
            await this.delay(deadlockResult.retryAfter);
          }

          continue;
        }

        this.logger.error(
          `Transaction ${transactionId} failed: ${error instanceof Error ? error.message : String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );

        throw error;
      } finally {
        if (queryRunner) {
          this.activeTransactions.delete(transactionId);
          await queryRunner.release();
        }
      }
    }

    throw new Error(`Transaction failed after ${maxRetries} retry attempts`);
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: TransactionConfig = {},
  ): Promise<T> {
    const maxRetries = config.retryAttempts || 3;
    const retryDelay = config.retryDelay || 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const deadlockResult = this.detectDeadlock(error);

        if (deadlockResult.isDeadlock && attempt < maxRetries) {
          this.logger.warn(
            `Retry attempt ${attempt + 1}/${maxRetries} due to deadlock`,
          );
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
          continue;
        }

        throw error;
      }
    }
    throw new Error(`Operation failed after ${maxRetries} retry attempts`);
  }

  private detectDeadlock(error: unknown): DeadlockDetectionResult {
    const errorMessage =
      error instanceof Error ? error.message.toLowerCase() : '';
    const isDeadlock =
      errorMessage.includes('deadlock') ||
      errorMessage.includes('lock wait timeout') ||
      (error instanceof Object &&
        'code' in error &&
        error.code === 'ER_LOCK_DEADLOCK') ||
      (error instanceof Object && 'errno' in error && error.errno === 1213);

    return {
      isDeadlock,
      shouldRetry: isDeadlock,
      retryAfter: isDeadlock ? Math.random() * 1000 + 100 : 0, // Random delay 100-1100ms
    };
  }

  private async handleTransactionTimeout(transactionId: string): Promise<void> {
    const queryRunner = this.activeTransactions.get(transactionId);

    if (queryRunner && queryRunner.isTransactionActive) {
      try {
        await queryRunner.rollbackTransaction();
        this.logger.warn(
          `Transaction ${transactionId} timed out and was rolled back`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to rollback timed out transaction: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getActiveTransactions(): string[] {
    return Array.from(this.activeTransactions.keys());
  }

  async forceRollbackTransaction(transactionId: string): Promise<boolean> {
    const queryRunner = this.activeTransactions.get(transactionId);

    if (queryRunner && queryRunner.isTransactionActive) {
      try {
        await queryRunner.rollbackTransaction();
        this.activeTransactions.delete(transactionId);
        this.logger.warn(`Transaction ${transactionId} was force rolled back`);
        return true;
      } catch (error) {
        this.logger.error(
          `Failed to force rollback transaction: ${error instanceof Error ? error.message : String(error)}`,
        );
        return false;
      }
    }

    return false;
  }
}
