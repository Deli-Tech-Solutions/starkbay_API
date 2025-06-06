export interface ArchiveCriteria {
    tableName: string;
    ageThreshold: number; // days
    sizeThreshold?: number; // MB
    customConditions?: string;
    retentionPeriod: number; // days before purge
    batchSize: number;
    enabled: boolean;
  }
  
  export interface ArchiveConfig {
    criteria: ArchiveCriteria[];
    globalSettings: {
      maxConcurrentJobs: number;
      defaultBatchSize: number;
      exportFormat: 'json' | 'csv' | 'sql';
      compressionEnabled: boolean;
    };
  }