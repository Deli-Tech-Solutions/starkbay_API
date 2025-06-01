import { QueryRunner, TableColumn, TableIndex, TableForeignKey } from 'typeorm';

export class MigrationUtils {
  static async addColumnIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    column: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingColumn = table?.findColumnByName(column.name);
    
    if (!existingColumn) {
      await queryRunner.addColumn(tableName, column);
    }
  }

  static async dropColumnIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingColumn = table?.findColumnByName(columnName);
    
    if (existingColumn) {
      await queryRunner.dropColumn(tableName, columnName);
    }
  }

  static async addIndexIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    index: TableIndex,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingIndex = table?.indices.find(idx => idx.name === index.name);
    
    if (!existingIndex) {
      await queryRunner.createIndex(tableName, index);
    }
  }

  static async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingIndex = table?.indices.find(idx => idx.name === indexName);
    
    if (existingIndex) {
      await queryRunner.dropIndex(tableName, indexName);
    }
  }

  static async addForeignKeyIfNotExists(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKey: TableForeignKey,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingForeignKey = table?.foreignKeys.find(fk => fk.name === foreignKey.name);
    
    if (!existingForeignKey) {
      await queryRunner.createForeignKey(tableName, foreignKey);
    }
  }

  static async dropForeignKeyIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    foreignKeyName: string,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingForeignKey = table?.foreignKeys.find(fk => fk.name === foreignKeyName);
    
    if (existingForeignKey) {
      await queryRunner.dropForeignKey(tableName, existingForeignKey);
    }
  }

  static async safeRenameColumn(
    queryRunner: QueryRunner,
    tableName: string,
    oldColumnName: string,
    newColumn: TableColumn,
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    const existingColumn = table?.findColumnByName(oldColumnName);
    
    if (existingColumn) {
      await queryRunner.changeColumn(tableName, oldColumnName, newColumn);
    }
  }

  static async backupTableData(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<any[]> {
    return await queryRunner.query(`SELECT * FROM ${tableName}`);
  }

  static async restoreTableData(
    queryRunner: QueryRunner,
    tableName: string,
    data: any[],
  ): Promise<void> {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.join(', ');

    for (const row of data) {
      const values = columns.map(col => row[col]);
      await queryRunner.query(
        `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`,
        values,
      );
    }
  }
}