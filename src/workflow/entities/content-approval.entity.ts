import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne
} from 'typeorm';
import { Content } from '../../content/entities/content.entity';
import { ApprovalStatus } from '../../content/enums/content.enums';

@Entity('content_approvals')
export class ContentApproval {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Content, content => content.approvals)
  content: Content;

  @Column()
  contentId: string;

  @Column({ length: 100 })
  reviewerId: string;

  @Column({ length: 100 })
  reviewerName: string;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING
  })
  status: ApprovalStatus;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'json', nullable: true })
  reviewData: any;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}