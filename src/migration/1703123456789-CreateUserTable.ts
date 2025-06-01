import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateUserTable1703123456789 implements MigrationInterface {
  name = 'CreateUserTable1703123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'username',
            type: 'varchar',
            length: '100',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'firstName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'lastName',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
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

    // Create indexes
    await queryRunner.createIndex(
      'users',
      new Index('IDX_USER_EMAIL', ['email']),
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_USER_USERNAME', ['username']),
    );

    await queryRunner.createIndex(
      'users',
      new Index('IDX_USER_ACTIVE', ['isActive']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_USER_ACTIVE');
    await queryRunner.dropIndex('users', 'IDX_USER_USERNAME');
    await queryRunner.dropIndex('users', 'IDX_USER_EMAIL');
    await queryRunner.dropTable('users');
  }
}

