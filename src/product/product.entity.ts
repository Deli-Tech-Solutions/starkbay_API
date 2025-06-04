import { ProductRating } from 'src/review/entities/product-rating.entity';
import { Review } from 'src/review/entities/review.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';

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

  @Column({ unique: true, length: 100, nullable: true })
  sku: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ default: false })
  hasVariants: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToOne(() => ProductRating, (rating) => rating.product)
  rating: ProductRating;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @Column({ default: true })
  isActive: boolean;

  // Virtual properties
  get hasActiveVariants(): boolean {
    return this.variants?.some(variant => variant.isActive) || false;
  }

  get defaultVariant(): ProductVariant | null {
    if (!this.variants || this.variants.length === 0) return null;
    return this.variants.find(v => v.position === 0) || this.variants[0];
  }

  get priceRange(): { min: number; max: number } | null {
    if (!this.variants || this.variants.length === 0) {
      return { min: this.price, max: this.price };
    }

    const activePrices = this.variants
      .filter(v => v.isActive)
      .map(v => v.price);

    if (activePrices.length === 0) {
      return { min: this.price, max: this.price };
    }

    return {
      min: Math.min(...activePrices),
      max: Math.max(...activePrices),
    };
  }
}
