import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index
} from 'typeorm';
import { Content } from './content.entity';

@Entity('content_analytics')
@Index(['contentId', 'eventType', 'createdAt'])
export class ContentAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, content => content.analytics)
  content: Content;

  @Column()
  contentId: string;

  @Column({ length: 50 })
  eventType: string; // view, click, share, download, etc.

  @Column({ type: 'json', nullable: true })
  eventData: any;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}