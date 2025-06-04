import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateAddressTable1703000000001 implements MigrationInterface {
  name = 'CreateAddressTable1703000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'addresses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['billing', 'shipping', 'both'],
            isNullable: false,
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'first_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'last_name',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'company',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'address_line_1',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'address_line_2',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'city',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'state_province',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'postal_code',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'country',
            type: 'enum',
            enum: ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP'],
            isNullable: false,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'formatted_address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'address_nickname',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'delivery_instructions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'addresses',
      new Index({
        name: 'IDX_addresses_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'addresses',
      new Index({
        name: 'IDX_addresses_user_type',
        columnNames: ['user_id', 'type'],
      }),
    );

    await queryRunner.createIndex(
      'addresses',
      new Index({
        name: 'IDX_addresses_user_default',
        columnNames: ['user_id', 'is_default'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('addresses');
  }
}
