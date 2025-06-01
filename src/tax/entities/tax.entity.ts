/* eslint-disable prettier/prettier */
import { Entity, Column, ManyToOne, BaseEntity } from 'typeorm';
import { Jurisdiction } from './jurisdiction.entity';
import { ProductCategory } from './product-category.entity';

@Entity()
export class Tax extends BaseEntity {
  @Column()
  name: string;

  @Column('decimal', { precision: 5, scale: 4 })
  rate: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Jurisdiction, { eager: true })
  jurisdiction: Jurisdiction;

  @ManyToOne(() => ProductCategory, { eager: true })
  productCategory: ProductCategory;
}
