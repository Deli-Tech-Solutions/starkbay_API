/* eslint-disable prettier/prettier */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Product } from 'src/product/product.entity';
import { User } from 'src/user/user.entity';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type:
    | 'view_product'
    | 'add_to_cart'
    | 'remove_from_cart'
    | 'checkout'
    | 'purchase';

  @ManyToOne(() => Product, { nullable: true })
  product: Product;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
