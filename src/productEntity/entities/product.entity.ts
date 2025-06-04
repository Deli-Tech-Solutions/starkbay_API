// productEntity/entities/product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { slugify } from '../utils/slug.util';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  NGN = 'NGN',
}

@Entity('products')
@Index(['slug'], { unique: true })
@Index(['status'])
@Index(['category'])
@Index(['createdAt'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 255 })
  slug: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  shortDescription: string;

  @Column({ length: 100, nullable: true })
  sku: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  comparePrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({
    type: 'enum',
    enum: Currency,
    default: Currency.USD,
  })
  currency: Currency;

  @Column('int', { default: 0 })
  quantity: number;

  @Column('int', { nullable: true })
  lowStockThreshold: number;

  @Column({ default: true })
  trackQuantity: boolean;

  @Column({ default: false })
  allowBackorder: boolean;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  weight: number;

  @Column({ length: 20, nullable: true })
  weightUnit: string;

  @Column('json', { nullable: true })
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };

  @Column('simple-array', { nullable: true })
  images: string[];

  @Column({ nullable: true })
  featuredImage: string;

  // SEO Fields
  @Column({ length: 160, nullable: true })
  metaTitle: string;

  @Column({ length: 320, nullable: true })
  metaDescription: string;

  @Column('simple-array', { nullable: true })
  metaKeywords: string[];

  @Column({ nullable: true })
  canonicalUrl: string;

  @Column('json', { nullable: true })
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
  };

  // Additional e-commerce fields
  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  requiresShipping: boolean;

  @Column({ default: false })
  isDigital: boolean;

  @Column('json', { nullable: true })
  variants: Array<{
    id: string;
    name: string;
    value: string;
    price?: number;
    sku?: string;
    quantity?: number;
  }>;

  @Column('json', { nullable: true })
  attributes: Record<string, any>;

  @Column('int', { default: 0 })
  viewCount: number;

  @Column('int', { default: 0 })
  salesCount: number;

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  averageRating: number;

  @Column('int', { default: 0 })
  reviewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  publishedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateSlug() {
    if (this.name && !this.slug) {
      this.slug = slugify(this.name);
    }
  }

  @BeforeUpdate()
  updatePublishedDate() {
    if (this.status === ProductStatus.ACTIVE && !this.publishedAt) {
      this.publishedAt = new Date();
    }
  }
}