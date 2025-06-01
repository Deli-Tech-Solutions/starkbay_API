import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class IndexManagementService {
  private readonly logger = new Logger(IndexManagementService.name);

  constructor(private dataSource: DataSource) {}

  /**
   * Create single-column indexes for frequently queried columns
   */
  async createSingleColumnIndexes(): Promise<void> {
    const indexes = [
      // User table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status ON users(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role)',
      
      // Order table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_total_amount ON orders(total_amount)',
      
      // Product table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_id ON products(category_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_price ON products(price)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_in_stock ON products(in_stock)',
    ];

    for (const indexQuery of indexes) {
      try {
        await this.dataSource.query(indexQuery);
        this.logger.log(`Created index: ${indexQuery.split(' ')[6]}`);
      } catch (error) {
        this.logger.error(`Failed to create index: ${error.message}`);
      }
    }
  }

  /**
   * Create composite indexes for complex queries
   */
  async createCompositeIndexes(): Promise<void> {
    const compositeIndexes = [
      // User filtering and sorting
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_status_created_at ON users(status, created_at DESC)',
      
      // Order queries with multiple conditions
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_status_date ON orders(user_id, status, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_amount ON orders(status, total_amount DESC)',
      
      // Product search and filtering
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_price ON products(category_id, price)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_stock_category ON products(in_stock, category_id) WHERE in_stock = true',
      
      // Join optimization indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id)',
    ];

    for (const indexQuery of compositeIndexes) {
      try {
        await this.dataSource.query(indexQuery);
        this.logger.log(`Created composite index: ${indexQuery.split(' ')[6]}`);
      } catch (error) {
        this.logger.error(`Failed to create composite index: ${error.message}`);
      }
    }
  }

  /**
   * Create partial indexes for filtered queries
   */
  async createPartialIndexes(): Promise<void> {
    const partialIndexes = [
      // Only index active users
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_email ON users(email) WHERE status = \'active\'',
      
      // Only index pending/processing orders
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_pending ON orders(created_at DESC) WHERE status IN (\'pending\', \'processing\')',
      
      // Only index available products
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_available ON products(category_id, price) WHERE in_stock = true AND deleted_at IS NULL',
      
      // Recent orders index
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_recent ON orders(user_id, created_at DESC) WHERE created_at > NOW() - INTERVAL \'30 days\'',
    ];

    for (const indexQuery of partialIndexes) {
      try {
        await this.dataSource.query(indexQuery);
        this.logger.log(`Created partial index: ${indexQuery.split(' ')[6]}`);
      } catch (error) {
        this.logger.error(`Failed to create partial index: ${error.message}`);
      }
    }
  }

  /**
   * Create expression indexes for computed queries
   */
  async createExpressionIndexes(): Promise<void> {
    const expressionIndexes = [
      // Full-text search
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector(\'english\', name || \' \' || email))',
      
      // Case-insensitive email search
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower ON users(lower(email))',
      
      // Date-based partitioning
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_month_year ON orders(EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at))',
    ];

    for (const indexQuery of expressionIndexes) {
      try {
        await this.dataSource.query(indexQuery);
        this.logger.log(`Created expression index: ${indexQuery.split(' ')[6]}`);
      } catch (error) {
        this.logger.error(`Failed to create expression index: ${error.message}`);
      }
    }
  }
}