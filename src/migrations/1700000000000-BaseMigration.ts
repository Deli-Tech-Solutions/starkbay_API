import { MigrationInterface, QueryRunner } from 'typeorm';

export class BaseMigration1700000000000 implements MigrationInterface {
  name = 'BaseMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // This is an empty base migration
    // Future migrations will be generated using TypeORM CLI
    console.log('Base migration executed');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is an empty base migration
    // Nothing to revert
    console.log('Base migration reverted');
  }
} 