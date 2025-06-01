/* eslint-disable prettier/prettier */
import {
  Entity,
  Column,
  BaseEntity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tax } from './tax.entity';

@Entity()
export class ProductCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ default: false })
  isTaxExempt: boolean;

  @Column({ default: true })
  isActive: boolean;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Tax, (tax) => tax.productCategory)
  taxes: Tax[];
}
