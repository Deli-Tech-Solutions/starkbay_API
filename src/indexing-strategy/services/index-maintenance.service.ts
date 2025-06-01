import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface IndexBloatInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  index_size: string;
  bloat_percent: number;
}

@Injectable()
export class IndexMaintenanceService {
  private readonly logger = new Logger(IndexMaintenanceService.name);

  constructor(private dataSource: DataSource) {}

  /**
   * Perform routine index maintenance
   */
  @Cron(CronExpression.EVERY_SUNDAY_AT_1AM)
  async performRoutineMaintenance(): Promise<void> {
    this.logger.log('Starting routine index maintenance...');

    await this.reindexFragmentedIndexes();
    await this.updateTableStatistics();
    await this.cleanupUnusedIndexes();

    this.logger.log('Routine index maintenance completed');
  }

  /**
   * Reindex fragmented indexes
   */
  private async reindexFragmentedIndexes(): Promise<void> {
    const fragmentedIndexes = await this.dataSource.query(`
      SELECT indexname 
      FROM pg_stat_user_indexes 
      WHERE avg_leaf_density < 80
        AND pg_relation_size(indexrelid) > 1024 * 1024 -- Only indexes > 1MB
    `);

    for (const index of fragmentedIndexes) {
      try {
        await this.dataSource.query(`REINDEX INDEX CONCURRENTLY ${index.indexname}`);
        this.logger.log(`Reindexed fragmented index: ${index.indexname}`);
      } catch (error) {
        this.logger.error(`Failed to reindex ${index.indexname}: ${error.message}`);
      }
    }
  }

  /**
   * Update table statistics for query planner
   */
  private async updateTableStatistics(): Promise<void> {
    const tables = await this.dataSource.query(`
      SELECT tablename 
      FROM pg_stat_user_tables 
      WHERE n_tup_ins + n_tup_upd + n_tup_del > 1000
    `);

    for (const table of tables) {
      try {
        await this.dataSource.query(`ANALYZE ${table.tablename}`);
        this.logger.log(`Updated statistics for table: ${table.tablename}`);
      } catch (error) {
        this.logger.error(`Failed to analyze ${table.tablename}: ${error.message}`);
      }
    }
  }

  /**
   * Clean up unused indexes (with approval)
   */
  private async cleanupUnusedIndexes(): Promise<void> {
    const unusedIndexes = await this.dataSource.query(`
      SELECT indexname, pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE idx_scan = 0
        AND indexname NOT LIKE '%_pkey'
        AND indexname NOT LIKE '%_unique%'
        AND pg_relation_size(indexrelid) > 10 * 1024 * 1024 -- Only indexes > 10MB
    `);

    if (unusedIndexes.length > 0) {
      this.logger.warn(`Found ${unusedIndexes.length} unused indexes consuming space:`);
      unusedIndexes.forEach(index => {
        this.logger.warn(`  ${index.indexname}: ${index.size}`);
      });
      this.logger.warn('Consider dropping these indexes if they are truly unused');
    }
  }

  /**
   * Monitor index bloat and recommend maintenance
   */
  async checkIndexBloat(): Promise<IndexBloatInfo[]> {
    const bloatInfo = await this.dataSource.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        ROUND(100 * (pg_relation_size(indexrelid) - 
          CASE WHEN pg_relation_size(indexrelid) = 0 THEN 0 
               ELSE pg_relation_size(indexrelid) * 0.8 
          END) / NULLIF(pg_relation_size(indexrelid), 0), 2) as bloat_percent
      FROM pg_stat_user_indexes
      WHERE pg_relation_size(indexrelid) > 1024 * 1024 -- Only indexes > 1MB
      ORDER BY pg_relation_size(indexrelid) DESC
    `);

    return bloatInfo.filter(info => info.bloat_percent > 20);
  }
}