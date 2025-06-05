import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { LoyaltyTier } from './loyalty-tier.entity';
import { Reward } from './reward.entity';

@Entity({ name: 'loyalty_programs' })
export class LoyaltyProgram {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Number of days before points expire (default: 365)
  @Column({ type: 'int', default: 365 })
  pointsExpirationDays: number;

  @OneToMany(() => LoyaltyTier, (tier) => tier.program, {
    cascade: true,
  })
  tiers: LoyaltyTier[];

  @OneToMany(() => Reward, (reward) => reward.program, {
    cascade: true,
  })
  rewards: Reward[];
}
