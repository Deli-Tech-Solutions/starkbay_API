/* eslint-disable prettier/prettier */
import { Entity, Column, BaseEntity } from 'typeorm';

@Entity()
export class TaxExemption extends BaseEntity {
  @Column()
  reason: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;
}
