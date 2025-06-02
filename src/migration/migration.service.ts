import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { SchemaVersion } from '../notification/entities/schema-version.entity';

export interface MigrationInfo {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  isApplied: boolean;
  appliedAt?: Date;
}

export interface MigrationResult {
  success: boolean;
  version: string;
  message: string;
  duration: number;
  rollbackInfo?: {
    canRollback: boolean;
    rollbackVersion?: string;
  };
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getCurrentVersion(): Promise<string | null> {
    try {
      const latestVersion = await this.dataSource
        .getRepository(SchemaVersion)
        .findOne({
          where: { isRollback: false },
          order: { appliedAt: 'DESC' },
        });

      return latestVersion?.version || null;
    } catch (error) {
      this.logger.warn('Could not retrieve current version, schema might not be initialized');
      return null;
    }
  }

  async getAllMigrations(): Promise<MigrationInfo[]> {
    const appliedMigrations = await this.dataSource
      .getRepository(SchemaVersion)
      .find({ order: { appliedAt: 'ASC' } });

    const pendingMigrations = await this.dataSource.showMigrations();
    
    const migrations: MigrationInfo[] = [];

    // Add applied migrations
    appliedMigrations.forEach(migration => {
      migrations.push({
        name: migration.version,
        version: migration.version,
        description: migration.description,
        isApplied: true,
        appliedAt: migration.appliedAt,
      });
    });

    // Add pending migrations
    pendingMigrations.forEach(migration => {
      if (!migrations.find(m => m.version === migration.name)) {
        migrations.push({
          name: migration.name,
          version: migration.name,
          isApplied: false,
        });
      }
    });

    return migrations.sort((a, b) => a.version.localeCompare(b.version));
  }

  async runMigrations(): Promise<MigrationResult[]> {
    const startTime = Date.now();
    const results: MigrationResult[] = [];

    try {
      const migrations = await this.dataSource.runMigrations();
      
      for (const migration of migrations) {
        const result: MigrationResult = {
          success: true,
          version: migration.name,
          message: `Migration ${migration.name} applied successfully`,
          duration: Date.now() - startTime,
          rollbackInfo: {
            canRollback: true,
            rollbackVersion: migration.name,
          },
        };

        // Record version in tracking table
        await this.recordMigration(migration.name, `Applied migration: ${migration.name}`);
        
        results.push(result);
        this.logger.log(`Migration ${migration.name} applied successfully`);
      }

      return results;
    } catch (error) {
      const result: MigrationResult = {
        success: false,
        version: 'unknown',
        message: `Migration failed: ${error.message}`,
        duration: Date.now() - startTime,
      };

      results.push(result);
      this.logger.error(`Migration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async revertMigration(): Promise<MigrationResult> {
    const startTime = Date.now();

    try {
      const currentVersion = await this.getCurrentVersion();
      await this.dataSource.undoLastMigration();

      // Record rollback
      if (currentVersion) {
        await this.recordRollback(currentVersion);
      }

      const result: MigrationResult = {
        success: true,
        version: currentVersion || 'unknown',
        message: `Migration ${currentVersion} reverted successfully`,
        duration: Date.now() - startTime,
      };

      this.logger.log(`Migration ${currentVersion} reverted successfully`);
      return result;
    } catch (error) {
      const result: MigrationResult = {
        success: false,
        version: 'unknown',
        message: `Migration revert failed: ${error.message}`,
        duration: Date.now() - startTime,
      };

      this.logger.error(`Migration revert failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async recordMigration(
    version: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const schemaVersion = new SchemaVersion();
    schemaVersion.version = version;
    schemaVersion.description = description;
    schemaVersion.metadata = metadata || {};
    schemaVersion.isRollback = false;

    await this.dataSource.getRepository(SchemaVersion).save(schemaVersion);
  }

  private async recordRollback(fromVersion: string): Promise<void> {
    const rollbackVersion = new SchemaVersion();
    rollbackVersion.version = `rollback_${fromVersion}_${Date.now()}`;
    rollbackVersion.description = `Rollback from version ${fromVersion}`;
    rollbackVersion.isRollback = true;
    rollbackVersion.rollbackFromVersion = fromVersion;

    await this.dataSource.getRepository(SchemaVersion).save(rollbackVersion);
  }

  async validateMigrationIntegrity(): Promise<boolean> {
    try {
      // Check if all applied migrations exist in the migrations directory
      const appliedMigrations = await this.dataSource
        .getRepository(SchemaVersion)
        .find({ where: { isRollback: false } });

      const availableMigrations = await this.dataSource.showMigrations();
      const availableNames = availableMigrations.map(m => m.name);

      for (const applied of appliedMigrations) {
        if (!availableNames.includes(applied.version)) {
          this.logger.warn(`Applied migration ${applied.version} not found in migrations directory`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error('Migration integrity check failed:', error.message);
      return false;
    }
  }
}
