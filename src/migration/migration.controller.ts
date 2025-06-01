import { Controller, Get, Post, Delete, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { MigrationService, MigrationResult } from './migration.service';
import { MigrationTestService } from './migration-test.service';
import { MigrationDependencyService } from './migration-dependency.service';

@Controller('migrations')
export class MigrationController {
  constructor(
    private migrationService: MigrationService,
    private migrationTestService: MigrationTestService,
    private dependencyService: MigrationDependencyService,
  ) {}

  @Get('status')
  async getStatus() {
    try {
      const currentVersion = await this.migrationService.getCurrentVersion();
      const migrations = await this.migrationService.getAllMigrations();
      const isValid = await this.migrationService.validateMigrationIntegrity();

      return {
        currentVersion,
        totalMigrations: migrations.length,
        appliedMigrations: migrations.filter(m => m.isApplied).length,
        pendingMigrations: migrations.filter(m => !m.isApplied).length,
        integrityValid: isValid,
        migrations,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get migration status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('run')
  async runMigrations(): Promise<MigrationResult[]> {
    try {
      return await this.migrationService.runMigrations();
    } catch (error) {
      throw new HttpException(
        `Failed to run migrations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('revert')
  async revertMigration(): Promise<MigrationResult> {
    try {
      return await this.migrationService.revertMigration();
    } catch (error) {
      throw new HttpException(
        `Failed to revert migration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('test/:name')
  async testMigration(@Param('name') name: string) {
    try {
      return await this.migrationTestService.testMigration(name);
    } catch (error) {
      throw new HttpException(
        `Failed to test migration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('dependencies')
  async getDependencies() {
    const validation = this.dependencyService.validateDependencies();
    const executionOrder = validation.isValid ? this.dependencyService.getExecutionOrder() : [];

    return {
      ...validation,
      executionOrder,
      dependencies: this.dependencyService.getAllDependencies(),
    };
  }

  @Post('dependencies')
  async addDependency(@Body() body: { name: string; dependencies: string[] }) {
    try {
      this.dependencyService.addMigration(body.name, body.dependencies);
      return { success: true, message: 'Dependency added successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to add dependency: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}