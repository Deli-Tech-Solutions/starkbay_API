import { registerAs } from '@nestjs/config';
import { ArchiveConfig } from '../interfaces/archive-config.interface';

export default registerAs('archive', (): ArchiveConfig => ({
  criteria: [
    {
      tableName: 'user_activities',
      ageThreshold: 90, // 3 months
      retentionPeriod: 2555, // 7 years
      batchSize: 1000,
      enabled: true,
    },
    {
      tableName: 'audit_logs',
      ageThreshold: 365, // 1 year
      sizeThreshold: 100, // 100MB
      retentionPeriod: 2555, // 7 years
      batchSize: 500,
      enabled: true,
    },
    {
      tableName: 'temporary_data',
      ageThreshold: 30, // 1 month
      retentionPeriod: 90, // 3 months
      batchSize: 2000,
      enabled: true,
    },
  ],
  globalSettings: {
    maxConcurrentJobs: 3,
    defaultBatchSize: 1000,
    exportFormat: 'json',
    compressionEnabled: true,
  },
}));
