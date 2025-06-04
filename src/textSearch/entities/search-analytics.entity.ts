import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('search_analytics')
export class SearchAnalytics {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 500 })
  query: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'int', default: 0 })
  results_count: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  user_ip: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  user_agent: string;

  @Column({ type: 'float', nullable: true })
  response_time: number;

  @Column({ type: 'jsonb', nullable: true })
  filters_applied: any;

  @CreateDateColumn()
  searched_at: Date;
}
