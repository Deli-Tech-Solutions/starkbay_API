import { NestFactory } from '@nestjs/core';
import { MigrationService } from '../src/migration/migration.service';
import { MigrationTestService } from '../src/migration/migration-test.service';
import { MigrationDependencyService } from '../src/migration/migration-dependency.service';
import { AppModule } from '../src/app.module';

async function runCIMigrationChecks() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const migrationService = app.get(MigrationService);
  const testService = app.get(MigrationTestService);
  const dependencyService = app.get(MigrationDependencyService);

  console.log('🔍 Running CI Migration Checks...');

  try {
    // 1. Validate migration integrity
    console.log('📋 Checking migration integrity...');
    const isIntegrityValid = await migrationService.validateMigrationIntegrity();
    if (!isIntegrityValid) {
      throw new Error('Migration integrity check failed');
    }
    console.log('✅ Migration integrity valid');

    // 2. Validate dependencies
    console.log('🔗 Checking migration dependencies...');
    const dependencyValidation = dependencyService.validateDependencies();
    if (!dependencyValidation.isValid) {
      throw new Error(`Dependency validation failed: ${dependencyValidation.errors.join(', ')}`);
    }
    console.log('✅ Migration dependencies valid');

    // 3. Test all pending migrations
    console.log('🧪 Testing pending migrations...');
    const allMigrations = await migrationService.getAllMigrations();
    const pendingMigrations = allMigrations.filter(m => !m.isApplied);

    for (const migration of pendingMigrations) {
      console.log(`  Testing migration: ${migration.name}`);
      const testResult = await testService.testMigration(migration.name);
      
      if (!testResult.success) {
        throw new Error(`Migration test failed for ${migration.name}: ${testResult.errors.join(', ')}`);
      }
      console.log(`  ✅ ${migration.name} passed all tests`);
    }

    // 4. Generate migration report
    const report = {
      timestamp: new Date().toISOString(),
      totalMigrations: allMigrations.length,
      pendingMigrations: pendingMigrations.length,
      appliedMigrations: allMigrations.filter(m => m.isApplied).length,
      integrityValid: isIntegrityValid,
      dependenciesValid: dependencyValidation.isValid,
      allTestsPassed: true,
    };

    console.log('📊 Migration Report:');
    console.log(JSON.stringify(report, null, 2));

    console.log('🎉 All CI migration checks passed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ CI Migration checks failed:', error.message);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run if called directly
if (require.main === module) {
  runCIMigrationChecks();
}

export { runCIMigrationChecks };

