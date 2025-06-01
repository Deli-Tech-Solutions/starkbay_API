import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../../product/product.entity';

@Entity('product_ratings')
export class ProductRating {
  @PrimaryColumn()
  productId: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  totalReviews: number;

  @Column({ type: 'int', default: 0 })
  rating1Count: number;

  @Column({ type: 'int', default: 0 })
  rating2Count: number;

  @Column({ type: 'int', default: 0 })
  rating3Count: number;

  @Column({ type: 'int', default: 0 })
  rating4Count: number;

  @Column({ type: 'int', default: 0 })
  rating5Count: number;

  @OneToOne(() => Product, (product) => product.rating)
  @JoinColumn()
  product: Product;

  @UpdateDateColumn()
  updatedAt: Date;
}
