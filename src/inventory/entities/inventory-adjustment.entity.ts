import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';
import { InventoryAdjustmentType } from '../enums/inventory-adjustment-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity()
export class InventoryAdjustment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Inventory, inventory => inventory.adjustments)
  inventory: Inventory;

  @Column({ type: 'enum', enum: InventoryAdjustmentType })
  type: InventoryAdjustmentType;

  @Column()
  quantity: number;

  @Column()
  quantityBefore: number;

  @Column()
  quantityAfter: number;

  @Column({ nullable: true })
  reason: string;

  @ManyToOne(() => User, { nullable: true })
  adjustedBy: User;

  @Column({ nullable: true })
  referenceId: string;

  @Column({ nullable: true })
  referenceType: string;

  @CreateDateColumn()
  createdAt: Date;
}