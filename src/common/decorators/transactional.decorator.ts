import { SetMetadata } from '@nestjs/common';
import { TransactionConfig } from '../types/transaction.types';

export const TRANSACTIONAL_KEY = 'transactional';

export const Transactional = (config: TransactionConfig = {}) =>
  SetMetadata(TRANSACTIONAL_KEY, config);

// Convenience decorators for common isolation levels
export const ReadCommitted = (
  config: Omit<TransactionConfig, 'isolationLevel'> = {},
) => Transactional({ ...config, isolationLevel: 'READ COMMITTED' });

export const ReadUncommitted = (
  config: Omit<TransactionConfig, 'isolationLevel'> = {},
) => Transactional({ ...config, isolationLevel: 'READ UNCOMMITTED' });

export const RepeatableRead = (
  config: Omit<TransactionConfig, 'isolationLevel'> = {},
) => Transactional({ ...config, isolationLevel: 'REPEATABLE READ' });

export const Serializable = (
  config: Omit<TransactionConfig, 'isolationLevel'> = {},
) => Transactional({ ...config, isolationLevel: 'SERIALIZABLE' });
