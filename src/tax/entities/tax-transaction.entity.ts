/* eslint-disable prettier/prettier */
import { Entity, Column, ManyToOne, BaseEntity } from 'typeorm';
import { Jurisdiction } from './jurisdiction.entity';

@Entity()
export class TaxTransaction extends BaseEntity {
  @Column()
  transactionId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  taxableAmount: number;

  @ManyToOne(() => Jurisdiction)
  jurisdiction: Jurisdiction;

  @Column()
  date: Date;
}
