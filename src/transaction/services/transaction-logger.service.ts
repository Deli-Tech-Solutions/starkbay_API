import { Injectable, Logger } from '@nestjs/common';
import { TransactionLogRepository } from '../repositories/transaction-log.repository';
import { v4 as uuidv4 } from 'uuid';
import {
  TransactionContext,
  TransactionStatus,
  TransactionLogEntry,
} from 'src/common/types/transaction.types';

@Injectable()
export class TransactionLoggerService {
  private readonly logger = new Logger(TransactionLoggerService.name);

  constructor(
    private readonly transactionLogRepository: TransactionLogRepository,
  ) {}

  async logTransactionStart(context: TransactionContext): Promise<void> {
    try {
      await this.transactionLogRepository.create({
        id: uuidv4(),
        transactionId: context.id,
        operation: 'START_TRANSACTION',
        tableName: 'N/A',
        timestamp: context.startTime,
        status: TransactionStatus.PENDING,
        isolationLevel: context.isolationLevel,
        metadata: context.metadata,
        duration: 0,
      });

      this.logger.debug(`Transaction started: ${context.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to log transaction start: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async logOperation(
    transactionId: string,
    operation: string,
    tableName: string,
    data?: Record<string, unknown>,
    duration: number = 0,
    success: boolean = true,
    error?: string,
  ): Promise<void> {
    try {
      await this.transactionLogRepository.create({
        id: uuidv4(),
        transactionId,
        operation,
        tableName,
        data,
        timestamp: new Date(),
        duration,
        status: success
          ? TransactionStatus.COMMITTED
          : TransactionStatus.FAILED,
        error,
      });

      this.logger.debug(
        `Operation logged: ${operation} on ${tableName} (${success ? 'SUCCESS' : 'FAILED'})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to log operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async logTransactionEnd(
    transactionId: string,
    success: boolean,
    duration: number,
    error?: string,
  ): Promise<void> {
    try {
      await this.transactionLogRepository.create({
        id: uuidv4(),
        transactionId,
        operation: success ? 'COMMIT_TRANSACTION' : 'ROLLBACK_TRANSACTION',
        tableName: 'N/A',
        timestamp: new Date(),
        duration,
        status: success
          ? TransactionStatus.COMMITTED
          : TransactionStatus.ROLLED_BACK,
        error,
      });

      this.logger.debug(
        `Transaction ended: ${transactionId} (${success ? 'COMMITTED' : 'ROLLED_BACK'})`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to log transaction end: ${errorMessage}`);
    }
  }

  async getTransactionAuditTrail(
    transactionId: string,
  ): Promise<TransactionLogEntry[]> {
    const logs =
      await this.transactionLogRepository.findByTransactionId(transactionId);

    return logs.map((log) => ({
      id: log.id,
      transactionId: log.transactionId,
      operation: log.operation,
      table: log.tableName,
      data: log.data as unknown,
      timestamp: log.timestamp,
      duration: log.duration,
      success: log.status === TransactionStatus.COMMITTED,
      error: log.error,
      metadata: log.metadata,
    }));
  }
}
