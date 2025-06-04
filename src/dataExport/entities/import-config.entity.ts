import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('import_configs')
export class ImportConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  tableName: string;

  @Column({ type: 'json' })
  columnMapping: Record<string, string>;

  @Column({ type: 'json', nullable: true })
  validationRules: any;

  @Column({ type: 'json', nullable: true })
  transformRules: any;

  @Column({ default: false })
  skipDuplicates: boolean;

  @Column({ default: false })
  updateExisting: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
