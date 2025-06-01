import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface IndexUsageStats {
  schema: string;
  table: string;
  index: string;
  scans: number;
  tuplesRead: number;
  tuplesFetched: number;
  size: string;
  usageLevel: string;
}

export interface UnusedIndex {
  schema: string;
  table: string;
  name: string;
  size: string;
  sizeBytes: number;
}

export interface IndexFragmentation {
  schemaname: string;
  tablename: string;
  indexname: string;
  index_size: string;
  fragmentation_percent: number;
}

@Injectable()
export class IndexMonitoringService {
  private readonly logger = new Logger(IndexMonitoringService.name);

  constructor(private dataSource: DataSource) {}

  /**
   * Monitor index usage and performance
   */
  async getIndexUsageStats(): Promise<IndexUsageStats[]> {
    const stats = await this.dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch,
        idx_scan,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        CASE 
          WHEN idx_scan = 0 THEN 'Never Used'
          WHEN idx_scan < 100 THEN 'Rarely Used'
          WHEN idx_scan < 1000 THEN 'Moderately Used'
          ELSE 'Frequently Used'
        END as usage_level
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `);

    return stats.map(stat => ({
      schema: stat.schemaname,
      table: stat.tablename,
      index: stat.indexname,
      scans: stat.idx_scan,
      tuplesRead: stat.idx_tup_read,
      tuplesFetched: stat.idx_tup_fetch,
      size: stat.index_size,
      usageLevel: stat.usage_level
    }));
  }

  /**
   * Identify unused indexes
   */
  async getUnusedIndexes(): Promise<UnusedIndex[]> {
    const unusedIndexes = await this.dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        pg_relation_size(indexrelid) as size_bytes
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_unique%'
      ORDER BY pg_relation_size(indexrelid) DESC
    `);

    return unusedIndexes.map(index => ({
      schema: index.schemaname,
      table: index.tablename,
      name: index.indexname,
      size: index.index_size,
      sizeBytes: index.size_bytes
    }));
  }

  /**
   * Monitor index fragmentation
   */
  async checkIndexFragmentation(): Promise<IndexFragmentation[]> {
    const fragmentation = await this.dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        ROUND(100 * (1 - (avg_leaf_density/100.0)), 2) as fragmentation_percent
      FROM pg_stat_user_indexes
      JOIN pg_class ON pg_class.oid = indexrelid
      WHERE avg_leaf_density IS NOT NULL
        AND avg_leaf_density < 90
      ORDER BY fragmentation_percent DESC
    `);

    return fragmentation;
  }

  /**
   * Generate performance report
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generatePerformanceReport(): Promise<void> {
    const usageStats = await this.getIndexUsageStats();
    const unusedIndexes = await this.getUnusedIndexes();

    this.logger.log('=== Daily Index Performance Report ===');
    this.logger.log(`Total indexes monitored: ${usageStats.length}`);
    this.logger.log(`Unused indexes: ${unusedIndexes.length}`);
    
    // Log top performing indexes
    const topIndexes = usageStats.slice(0, 5);
    this.logger.log('Top 5 most used indexes:');
    topIndexes.forEach(index => {
      this.logger.log(`  ${index.index}: ${index.scans} scans, ${index.size}`);
    });

    // Log unused indexes
    if (unusedIndexes.length > 0) {
      this.logger.warn('Unused indexes (consider dropping):');
      unusedIndexes.slice(0, 5).forEach(index => {
        this.logger.warn(`  ${index.name}: ${index.size}`);
      });
    }
  }
}