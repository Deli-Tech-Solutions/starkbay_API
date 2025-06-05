import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { LoyaltyProgram } from './loyalty-program.entity';

@Entity({ name: 'rewards' })
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  pointsCost: number;

  @Column({ type: 'int', default: 0 })
  stock: number; // number of items available

  @ManyToOne(() => LoyaltyProgram, (program) => program.rewards, {
    onDelete: 'CASCADE',
  })
  program: LoyaltyProgram;
}
