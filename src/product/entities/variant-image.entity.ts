import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';

@Entity('variant_images')
@Index(['variant', 'position'])
@Index(['isActive'])
export class VariantImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.images, {
    onDelete: 'CASCADE',
  })
  variant: ProductVariant;

  @Column({ name: 'variant_id' })
  variantId: string;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 255, nullable: true })
  altText: string;

  @Column({ length: 255, nullable: true })
  title: string;

  @Column({ type: 'int', nullable: true })
  width: number;

  @Column({ type: 'int', nullable: true })
  height: number;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ length: 50, nullable: true })
  mimeType: string;

  @Column({ default: 0 })
  position: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ type: 'json', nullable: true })
  variants: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    xlarge?: string;
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    source?: string;
    tags?: string[];
    description?: string;
    photographer?: string;
    copyright?: string;
    exif?: Record<string, any>;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get thumbnailUrl(): string {
    return this.variants?.thumbnail || this.url;
  }

  get displayTitle(): string {
    return this.title || this.altText || `Variant Image ${this.position + 1}`;
  }

  get aspectRatio(): number {
    if (!this.width || !this.height) return 1;
    return this.width / this.height;
  }

  get fileSizeFormatted(): string {
    if (!this.fileSize) return '';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
} 