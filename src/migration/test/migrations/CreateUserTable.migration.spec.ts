import { MigrationTestService } from '../../src/migration/migration-test.service';

describe('CreateUserTable Migration', () => {
  let migrationTestService: MigrationTestService;

  beforeAll(() => {
    migrationTestService = global.testModule.get(MigrationTestService);
  });

  it('should apply and rollback cleanly', async () => {
    const result = await migrationTestService.testMigration('CreateUserTable1703123456789');

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.rollbackTest.success).toBe(true);
    expect(result.dataIntegrityChecks.length).toBeGreaterThan(0);
    
    // Check specific integrity tests
    const constraintCheck = result.dataIntegrityChecks.find(c => c.name === 'Constraints');
    expect(constraintCheck?.passed).toBe(true);
    
    const indexCheck = result.dataIntegrityChecks.find(c => c.name === 'Indexes');
    expect(indexCheck?.passed).toBe(true);
  });

  it('should maintain data integrity during migration', async () => {
    // Test data preservation during migration
    const result = await migrationTestService.testMigration('CreateUserTable1703123456789');
    
    result.dataIntegrityChecks.forEach(check => {
      expect(check.passed).toBe(true);
    });
  });
});
