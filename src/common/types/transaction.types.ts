import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export interface TransactionConfig {
  isolationLevel?: IsolationLevel;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface TransactionContext {
  id: string;
  startTime: Date;
  isolationLevel: IsolationLevel;
  operations: TransactionOperation[];
  metadata?: Record<string, any>;
}

export interface TransactionOperation {
  operation: string;
  table: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  error?: string;
}

export interface TransactionLogEntry {
  id: string;
  transactionId: string;
  operation: string;
  table: string;
  data?: any;
  timestamp: Date;
  duration: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMMITTED = 'COMMITTED',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED',
}

export interface DeadlockDetectionResult {
  isDeadlock: boolean;
  shouldRetry: boolean;
  retryAfter: number;
}
