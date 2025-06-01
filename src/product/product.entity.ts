import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Review } from '../review/entities/review.entity';
import { ProductRating } from '../review/entities/product-rating.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToOne(() => ProductRating, (rating) => rating.product)
  rating: ProductRating;
}
