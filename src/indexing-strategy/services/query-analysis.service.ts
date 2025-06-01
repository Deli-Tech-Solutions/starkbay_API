import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface QueryPattern {
  query: string;
  frequency: number;
  avgExecutionTime: number;
  totalTime: number;
  cacheHitRate: number;
}

export interface IndexSuggestion {
  table: string;
  columns?: string[];
  type: 'SINGLE_COLUMN' | 'COMPOSITE' | 'PARTIAL' | 'EXPRESSION';
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedIndex?: string;
}

@Injectable()
export class QueryAnalysisService {
  private readonly logger = new Logger(QueryAnalysisService.name);

  constructor(private dataSource: DataSource) {}

  /**
   * Analyze common query patterns from PostgreSQL logs
   */
  async analyzeQueryPatterns(): Promise<QueryPattern[]> {
    const slowQueries = await this.dataSource.query(`
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE calls > 100 
        AND mean_time > 10
      ORDER BY total_time DESC 
      LIMIT 50
    `);

    return slowQueries.map(query => ({
      query: query.query,
      frequency: query.calls,
      avgExecutionTime: query.mean_time,
      totalTime: query.total_time,
      cacheHitRate: query.hit_percent || 0
    }));
  }

  /**
   * Identify missing indexes based on query patterns
   */
  async suggestMissingIndexes(): Promise<IndexSuggestion[]> {
    const suggestions: IndexSuggestion[] = [];

    // Analyze table scans
    const tableScans = await this.dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        idx_tup_fetch,
        seq_tup_read / CASE WHEN seq_scan = 0 THEN 1 ELSE seq_scan END as avg_seq_tup_read
      FROM pg_stat_user_tables
      WHERE seq_scan > idx_scan
        AND seq_tup_read > 10000
      ORDER BY seq_tup_read DESC
    `);

    for (const scan of tableScans) {
      suggestions.push({
        table: scan.tablename,
        type: 'SINGLE_COLUMN',
        reason: `High sequential scan ratio (${scan.seq_scan} seq vs ${scan.idx_scan} idx)`,
        priority: 'HIGH'
      });
    }

    return suggestions;
  }
}