import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { VariantAttribute } from './variant-attribute.entity';

@Entity('variant_attribute_values')
@Index(['variant', 'attribute'])
@Index(['attribute', 'value'])
@Unique(['variant', 'attribute'])
export class VariantAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductVariant, (variant) => variant.attributeValues, {
    onDelete: 'CASCADE',
  })
  variant: ProductVariant;

  @Column({ name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => VariantAttribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
  })
  attribute: VariantAttribute;

  @Column({ name: 'attribute_id' })
  attributeId: string;

  @Column({ length: 255 })
  value: string;

  @Column({ length: 255, nullable: true })
  displayValue: string;

  @Column({ type: 'json', nullable: true })
  metadata: {
    color?: string; // Hex color code for color attributes
    image?: string; // Image URL for image attributes
    data?: any; // Additional structured data
  };

  @Column({ default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get label(): string {
    return this.displayValue || this.value;
  }

  get isColor(): boolean {
    return this.attribute?.type === 'color';
  }

  get isImage(): boolean {
    return this.attribute?.type === 'image';
  }

  get colorValue(): string | null {
    return this.metadata?.color || null;
  }

  get imageValue(): string | null {
    return this.metadata?.image || null;
  }
} 