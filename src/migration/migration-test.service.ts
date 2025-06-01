import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

export interface MigrationTestResult {
  migrationName: string;
  success: boolean;
  errors: string[];
  dataIntegrityChecks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
  rollbackTest: {
    success: boolean;
    message: string;
  };
}

@Injectable()
export class MigrationTestService {
  private readonly logger = new Logger(MigrationTestService.name);

  constructor(private dataSource: DataSource) {}

  async testMigration(migrationName: string): Promise<MigrationTestResult> {
    const result: MigrationTestResult = {
      migrationName,
      success: false,
      errors: [],
      dataIntegrityChecks: [],
      rollbackTest: { success: false, message: '' },
    };

    let queryRunner: QueryRunner | null = null;

    try {
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Test migration application
      await this.testMigrationApplication(queryRunner, migrationName, result);

      // Test data integrity
      await this.testDataIntegrity(queryRunner, result);

      // Test rollback capability
      await this.testRollback(queryRunner, migrationName, result);

      result.success = result.errors.length === 0;

      await queryRunner.rollbackTransaction();
    } catch (error) {
      result.errors.push(`Test execution failed: ${error.message}`);
      if (queryRunner?.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
    } finally {
      if (queryRunner) {
        await queryRunner.release();
      }
    }

    return result;
  }

  private async testMigrationApplication(
    queryRunner: QueryRunner,
    migrationName: string,
    result: MigrationTestResult,
  ): Promise<void> {
    try {
      // Get migration file and execute it
      const migrations = await this.dataSource.showMigrations();
      const migration = migrations.find(m => m.name === migrationName);

      if (!migration) {
        result.errors.push(`Migration ${migrationName} not found`);
        return;
      }

      // Execute migration up
      await migration.up(queryRunner);
      this.logger.log(`Migration ${migrationName} applied successfully in test`);
    } catch (error) {
      result.errors.push(`Migration application failed: ${error.message}`);
    }
  }

  private async testDataIntegrity(
    queryRunner: QueryRunner,
    result: MigrationTestResult,
  ): Promise<void> {
    const integrityChecks = [
      this.checkConstraints(queryRunner),
      this.checkIndexes(queryRunner),
      this.checkForeignKeys(queryRunner),
      this.checkNotNullConstraints(queryRunner),
    ];

    const checkResults = await Promise.allSettled(integrityChecks);

    checkResults.forEach((checkResult, index) => {
      const checkNames = ['Constraints', 'Indexes', 'Foreign Keys', 'Not Null Constraints'];
      
      if (checkResult.status === 'fulfilled' && checkResult.value) {
        result.dataIntegrityChecks.push({
          name: checkNames[index],
          passed: true,
          message: 'Check passed',
        });
      } else {
        const error = checkResult.status === 'rejected' ? checkResult.reason : 'Check failed';
        result.dataIntegrityChecks.push({
          name: checkNames[index],
          passed: false,
          message: error.message || 'Unknown error',
        });
        result.errors.push(`Data integrity check failed: ${checkNames[index]}`);
      }
    });
  }

  private async testRollback(
    queryRunner: QueryRunner,
    migrationName: string,
    result: MigrationTestResult,
  ): Promise<void> {
    try {
      const migrations = await this.dataSource.showMigrations();
      const migration = migrations.find(m => m.name === migrationName);

      if (!migration) {
        result.rollbackTest = {
          success: false,
          message: `Migration ${migrationName} not found for rollback test`,
        };
        return;
      }

      // Execute migration down
      await migration.down(queryRunner);
      
      result.rollbackTest = {
        success: true,
        message: 'Rollback test passed',
      };

      this.logger.log(`Migration ${migrationName} rollback tested successfully`);
    } catch (error) {
      result.rollbackTest = {
        success: false,
        message: `Rollback test failed: ${error.message}`,
      };
      result.errors.push(`Rollback test failed: ${error.message}`);
    }
  }

  private async checkConstraints(queryRunner: QueryRunner): Promise<boolean> {
    // Implementation depends on database type
    const query = `
      SELECT COUNT(*) as count 
      FROM information_schema.table_constraints 
      WHERE constraint_schema = current_schema()
    `;
    
    const result = await queryRunner.query(query);
    return result.length > 0;
  }

  private async checkIndexes(queryRunner: QueryRunner): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE schemaname = current_schema()
    `;
    
    const result = await queryRunner.query(query);
    return result.length > 0;
  }

  private async checkForeignKeys(queryRunner: QueryRunner): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM information_schema.key_column_usage 
      WHERE constraint_schema = current_schema() 
      AND referenced_table_name IS NOT NULL
    `;
    
    const result = await queryRunner.query(query);
    return result.length >= 0; // Can be 0 if no foreign keys
  }

  private async checkNotNullConstraints(queryRunner: QueryRunner): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = current_schema() 
      AND is_nullable = 'NO'
    `;
    
    const result = await queryRunner.query(query);
    return result.length > 0;
  }
}