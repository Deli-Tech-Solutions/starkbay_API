import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { VariantAttributeValue } from './variant-attribute-value.entity';

export enum AttributeType {
  TEXT = 'text',
  COLOR = 'color',
  IMAGE = 'image',
  SELECT = 'select',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
}

export enum AttributeInputType {
  TEXT = 'text',
  SELECT = 'select',
  COLOR_PICKER = 'color_picker',
  IMAGE_UPLOAD = 'image_upload',
  CHECKBOX = 'checkbox',
  NUMBER = 'number',
  RADIO = 'radio',
}

@Entity('variant_attributes')
@Index(['name'], { unique: true })
@Index(['type'])
@Index(['isActive'])
export class VariantAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: AttributeType })
  type: AttributeType;

  @Column({ type: 'enum', enum: AttributeInputType })
  inputType: AttributeInputType;

  @Column({ default: 0 })
  position: number;

  @Column({ default: true })
  isRequired: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ default: false })
  isFilterable: boolean;

  @Column({ default: false })
  showInProductList: boolean;

  @Column({ type: 'json', nullable: true })
  options: string[]; // For select/radio types

  @Column({ type: 'json', nullable: true })
  validation: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => VariantAttributeValue, (value) => value.attribute)
  values: VariantAttributeValue[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties
  get label(): string {
    return this.displayName || this.name;
  }

  get hasOptions(): boolean {
    return this.options && this.options.length > 0;
  }
} 