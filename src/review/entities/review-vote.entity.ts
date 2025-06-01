import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { Review } from './review.entity';

@Entity('review_votes')
@Index(['review', 'user'], { unique: true }) // One vote per user per review
export class ReviewVote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean' })
  isHelpful: boolean; // true = helpful, false = not helpful

  @ManyToOne(() => User, (user) => user.reviewVotes, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Review, (review) => review.votes, { onDelete: 'CASCADE' })
  review: Review;

  @CreateDateColumn()
  createdAt: Date;
}
