import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('articles')
@Index(['search_vector'])
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 100 })
  author: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'varchar', array: true, default: [] })
  tags: string[];

  @Column({ type: 'tsvector', select: false })
  search_vector: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @CreateDateColumn()
  published_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
