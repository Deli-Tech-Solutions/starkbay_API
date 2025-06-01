/* eslint-disable prettier/prettier */
import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@MappedTypes()
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
function MappedTypes(): (
  target: typeof BaseEntity,
) => void | typeof BaseEntity {
  throw new Error('Function not implemented.');
}
