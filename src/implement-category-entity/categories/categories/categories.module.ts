import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}

// ===== DATABASE MIGRATION =====
// src/migrations/YYYYMMDDHHMMSS-create-categories.ts
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateCategories1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'categories',
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
            isNullable: false,
          },
          {
            name: 'slug',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'imageUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive'],
            default: "'active'",
          },
          {
            name: 'sortOrder',
            type: 'int',
            default: 0,
          },
          {
            name: 'path',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'level',
            type: 'int',
            default: 0,
          },
          {
            name: 'parentId',
            type: 'uuid',
            isNullable: true,
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
        foreignKeys: [
          {
            columnNames: ['parentId'],
            referencedTableName: 'categories',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'categories',
      new Index('IDX_categories_slug', ['slug'], { isUnique: true }),
    );
    await queryRunner.createIndex(
      'categories',
      new Index('IDX_categories_parentId', ['parentId']),
    );
    await queryRunner.createIndex(
      'categories',
      new Index('IDX_categories_status', ['status']),
    );
    await queryRunner.createIndex(
      'categories',
      new Index('IDX_categories_path', ['path']),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('categories');
  }
}