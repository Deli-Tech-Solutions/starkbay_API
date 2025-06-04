import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('searches')
@Index(['search_vector'])
export class SearchEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', array: true, default: [] })
  tags: string[];

  @Column({ type: 'tsvector', select: false })
  search_vector: string;

  @Column({ type: 'float', default: 0 })
  rank_score: number;

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

