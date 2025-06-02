import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { InventoryVariant } from './inventory-variant.entity';
import { InventoryAdjustment } from './inventory-adjustment.entity';

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { nullable: false })
  product: Product;

  @Column({ default: 0 })
  quantityOnHand: number;

  @Column({ default: 0 })
  quantityReserved: number;

  @Column({ nullable: true })
  reorderPoint: number;

  @Column({ nullable: true })
  reorderQuantity: number;

  @Column({ default: false })
  trackInventory: boolean;

  @OneToMany(() => InventoryVariant, variant => variant.inventory)
  variants: InventoryVariant[];

  @OneToMany(() => InventoryAdjustment, adjustment => adjustment.inventory)
  adjustments: InventoryAdjustment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}