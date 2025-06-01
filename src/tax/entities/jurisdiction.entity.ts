/* eslint-disable prettier/prettier */
import {
  Entity,
  Column,
  OneToMany,
  BaseEntity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tax } from './tax.entity';

@Entity()
export class Jurisdiction extends BaseEntity {
  @Column()
  country: string;

  @Column({ nullable: true })
  state?: string;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => Tax, (tax) => tax.jurisdiction)
  taxes: Tax[];
}
