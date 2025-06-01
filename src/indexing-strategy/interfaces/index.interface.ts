export interface DatabaseIndex {
    name: string;
    table: string;
    columns: string[];
    type: IndexType;
    isUnique: boolean;
    isPartial: boolean;
    condition?: string;
    size: number;
    lastUsed?: Date;
  }
  
  export interface QueryPerformance {
    query: string;
    executionTime: number;
    planningTime: number;
    bufferHits: number;
    bufferReads: number;
    tempFiles: number;
    tempBytes: number;
  }
  
  export interface IndexRecommendation {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    type: 'CREATE' | 'DROP' | 'MODIFY';
    table: string;
    currentIndex?: string;
    suggestedIndex: string;
    reason: string;
    estimatedImpact: string;
    estimatedSize: string;
  }
  
  export interface MaintenanceTask {
    type: 'REINDEX' | 'ANALYZE' | 'VACUUM' | 'DROP_INDEX';
    target: string;
    reason: string;
    priority: number;
    estimatedDuration: string;
    scheduledAt?: Date;
  }