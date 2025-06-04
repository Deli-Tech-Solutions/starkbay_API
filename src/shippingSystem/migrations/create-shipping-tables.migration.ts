import { MigrationInterface, QueryRunner, Table, ForeignKey, Index } from 'typeorm';

export class CreateShippingTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create shipping_zones table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_zones',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'countries',
            type: 'json',
          },
          {
            name: 'states',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'zipCodes',
            type: 'json',
            isNullable: true,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create shipping_methods table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_methods',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['standard', 'express', 'overnight', 'same_day', 'pickup'],
          },
          {
            name: 'carrier',
            type: 'enum',
            enum: ['fedex', 'ups', 'dhl', 'usps', 'local'],
          },
          {
            name: 'estimatedDays',
            type: 'int',
          },
          {
            name: 'baseCost',
            type: 'decimal',
            precision: 5,
            scale: 2,
          },
          {
            name: 'weightMultiplier',
            type: 'decimal',
            precision: 5,
            scale: 4,
          },
          {
            name: 'maxWeight',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create shipping_rates table
    await queryRunner.createTable(
      new Table({
        name: 'shipping_rates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'minWeight',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'maxWeight',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'rate',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'freeShippingThreshold',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'shippingZoneId',
            type: 'uuid',
          },
          {
            name: 'shippingMethodId',
            type: 'uuid',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create shipments table
    await queryRunner.createTable(
      new Table({
        name: 'shipments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'trackingNumber',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
            default: "'pending'",
          },
          {
            name: 'carrier',
            type: 'enum',
            enum: ['fedex', 'ups', 'dhl', 'usps', 'local'],
          },
          {
            name: 'cost',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'weight',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'dimensions',
            type: 'json',
          },
          {
            name: 'fromAddress',
            type: 'json',
          },
          {
            name: 'toAddress',
            type: 'json',
          },
          {
            name: 'estimatedDeliveryDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'actualDeliveryDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'shippedDate',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'orderId',
            type: 'uuid',
          },
          {
            name: 'shippingZoneId',
            type: 'uuid',
          },
          {
            name: 'shippingMethodId',
            type: 'uuid',
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create tracking_events table
    await queryRunner.createTable(
      new Table({
        name: 'tracking_events',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'eventType',
            type: 'enum',
            enum: ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned'],
          },
          {
            name: 'description',
            type: 'varchar',
            length: '500',
          },
          {
            name: 'location',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'timestamp',
            type: 'timestamp',
          },
          {
            name: 'shippingId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'shipping_rates',
      new ForeignKey({
        columnNames: ['shippingZoneId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_zones',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipping_rates',
      new ForeignKey({
        columnNames: ['shippingMethodId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_methods',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'shipments',
      new ForeignKey({
        columnNames: ['shippingZoneId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_zones',
      }),
    );

    await queryRunner.createForeignKey(
      'shipments',
      new ForeignKey({
        columnNames: ['shippingMethodId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipping_methods',
      }),
    );

    await queryRunner.createForeignKey(
      'tracking_events',
      new ForeignKey({
        columnNames: ['shippingId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'shipments',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex('shipments', new Index('IDX_SHIPMENTS_TRACKING', ['trackingNumber']));
    await queryRunner.createIndex('shipments', new Index('IDX_SHIPMENTS_STATUS', ['status']));
    await queryRunner.createIndex('tracking_events', new Index('IDX_TRACKING_EVENTS_TIMESTAMP', ['timestamp']));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tracking_events');
    await queryRunner.dropTable('shipments');
    await queryRunner.dropTable('shipping_rates');
    await queryRunner.dropTable('shipping_methods');
    await queryRunner.dropTable('shipping_zones');
  }
}