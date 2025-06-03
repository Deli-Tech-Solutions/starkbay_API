import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionLog } from './entities/transaction-log.entity';
import { TransactionLogRepository } from './repositories/transaction-log.repository';
import { TransactionLoggerService } from './services/transaction-logger.service';
import { TransactionManagerService } from './services/transaction-manager.service';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionLog])],
  controllers: [TransactionController],
  providers: [
    TransactionLogRepository,
    TransactionManagerService,
    TransactionLoggerService,
    TransactionService,
  ],
  exports: [
    TransactionManagerService,
    TransactionLoggerService,
    TransactionLogRepository,
  ],
})
export class TransactionModule {}
