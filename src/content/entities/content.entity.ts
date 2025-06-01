import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  Index
} from 'typeorm';
import { ContentType, ContentStatus, ContentPriority } from '../enums/content.enums';
import { ContentCategory } from './content-category.entity';
import { ContentTag } from './content-tag.entity';
import { ContentAnalytics } from './content-analytics.entity';
import { ContentApproval } from '../../workflow/entities/content-approval.entity';

@Entity('contents')
@Index(['type', 'status'])
@Index(['publishedAt'])
@Index(['expiresAt'])
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  content: any; // Flexible content structure

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.MARKETING
  })
  type: ContentType;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.DRAFT
  })
  status: ContentStatus;

  @Column({
    type: 'enum',
    enum: ContentPriority,
    default: ContentPriority.MEDIUM
  })
  priority: ContentPriority;

  // SEO Fields
  @Column({ length: 255, nullable: true })
  metaTitle: string;

  @Column({ type: 'text', nullable: true })
  metaDescription: string;

  @Column({ type: 'simple-array', nullable: true })
  metaKeywords: string[];

  @Column({ length: 255, nullable: true })
  slug: string;

  // Scheduling
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  // Media
  @Column({ type: 'simple-array', nullable: true })
  images: string[];

  @Column({ type: 'simple-array', nullable: true })
  videos: string[];

  @Column({ type: 'json', nullable: true })
  attachments: any[];

  // Targeting
  @Column({ type: 'simple-array', nullable: true })
  targetAudience: string[];

  @Column({ type: 'simple-array', nullable: true })
  targetRegions: string[];

  // Author and Approval
  @Column({ length: 100 })
  authorId: string;

  @Column({ length: 100, nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  // Relationships
  @ManyToOne(() => ContentCategory, category => category.contents)
  category: ContentCategory;

  @Column({ nullable: true })
  categoryId: string;

  @ManyToMany(() => ContentTag, tag => tag.contents)
  @JoinTable({
    name: 'content_tags',
    joinColumn: { name: 'contentId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' }
  })
  tags: ContentTag[];

  @OneToMany(() => ContentAnalytics, analytics => analytics.content)
  analytics: ContentAnalytics[];

  @OneToMany(() => ContentApproval, approval => approval.content)
  approvals: ContentApproval[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isPublished(): boolean {
    return this.status === ContentStatus.PUBLISHED && 
           (!this.scheduledAt || this.scheduledAt <= new Date()) &&
           (!this.expiresAt || this.expiresAt > new Date());
  }

  get isExpired(): boolean {
    return this.expiresAt && this.expiresAt <= new Date();
  }
}