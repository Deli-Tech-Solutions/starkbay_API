import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { LoyaltyProgram } from './loyalty-program.entity';

export enum PointsType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
}

@Entity({ name: 'points_transactions' })
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.pointsTransactions, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => LoyaltyProgram, (program) => program.id, {
    onDelete: 'CASCADE',
  })
  program: LoyaltyProgram;

  @Column({ type: 'enum', enum: PointsType })
  type: PointsType;

  @Column({ type: 'int' })
  points: number;

  // A JSON field to store e.g. { orderId: '...', rewardId: '...' }
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expirationDate: Date;
}
