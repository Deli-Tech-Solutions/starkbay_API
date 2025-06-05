import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LoyaltyProgram } from './loyalty-program.entity';

@Entity({ name: 'loyalty_tiers' })
export class LoyaltyTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // e.g. 'Bronze', 'Silver', 'Gold'

  @Column({ type: 'int' })
  minPoints: number; // minimum points needed to qualify

  @Column({ type: 'int', default: 0 })
  benefitsDiscountPercent: number;

  @ManyToOne(() => LoyaltyProgram, (program) => program.tiers, {
    onDelete: 'CASCADE',
  })
  program: LoyaltyProgram;
}
