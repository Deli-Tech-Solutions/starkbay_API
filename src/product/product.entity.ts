import { ProductRating } from 'src/review/entities/product-rating.entity';
import { Review } from 'src/review/entities/review.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ default: true })
  isActive: boolean;
}
