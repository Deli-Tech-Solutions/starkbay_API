import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Product } from '../../product/product.entity';
import { ReviewVote } from './review-vote.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FLAGGED = 'flagged',
}

@Entity('reviews')
@Index(['product', 'user'], { unique: true }) // One review per user per product
@Index(['product', 'status', 'createdAt'])
@Index(['rating'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', width: 1 })
  rating: number; // 1-5 stars

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ type: 'boolean', default: false })
  isVerifiedPurchase: boolean;

  @Column({ type: 'int', default: 0 })
  helpfulVotes: number;

  @Column({ type: 'int', default: 0 })
  totalVotes: number;

  @Column({ type: 'text', nullable: true })
  moderatorNotes: string;

  @Column({ type: 'datetime', nullable: true })
  moderatedAt: Date;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @OneToMany(() => ReviewVote, (vote) => vote.review)
  votes: ReviewVote[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property for helpfulness percentage
  get helpfulnessRatio(): number {
    return this.totalVotes > 0 ? this.helpfulVotes / this.totalVotes : 0;
  }
}
