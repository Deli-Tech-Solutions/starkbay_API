import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';
import { MigrationUtils } from '../migration/migration.utils';

export class AddUserProfile1703123456790 implements MigrationInterface {
  name = 'AddUserProfile1703123456790';
  
  // Define dependencies - this migration requires the CreateUserTable migration
  dependencies = ['CreateUserTable1703123456789'];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_profiles table
    await queryRunner.createTable(
      new Table({
        name: 'user_profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'avatar',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'address',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'json',
            isNullable: true,
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraint
    await MigrationUtils.addForeignKeyIfNotExists(
      queryRunner,
      'user_profiles',
      new TableForeignKey({
        name: 'FK_USER_PROFILE_USER',
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    // Add indexes
    await MigrationUtils.addIndexIfNotExists(
      queryRunner,
      'user_profiles',
      new TableIndex({
        name: 'IDX_USER_PROFILE_USER_ID',
        columnNames: ['userId'],
        isUnique: true,
      }),
    );

    await MigrationUtils.addIndexIfNotExists(
      queryRunner,
      'user_profiles',
      new TableIndex({
        name: 'IDX_USER_PROFILE_PHONE',
        columnNames: ['phoneNumber'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await MigrationUtils.dropIndexIfExists(queryRunner, 'user_profiles', 'IDX_USER_PROFILE_PHONE');
    await MigrationUtils.dropIndexIfExists(queryRunner, 'user_profiles', 'IDX_USER_PROFILE_USER_ID');
    
    // Drop foreign key
    await MigrationUtils.dropForeignKeyIfExists(queryRunner, 'user_profiles', 'FK_USER_PROFILE_USER');
    
    // Drop table
    await queryRunner.dropTable('user_profiles');
  }
}
