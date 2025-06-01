import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany
} from 'typeorm';
import { Content } from './content.entity';

@Entity('content_tags')
export class ContentTag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  usageCount: number;

  @ManyToMany(() => Content, content => content.tags)
  contents: Content[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}