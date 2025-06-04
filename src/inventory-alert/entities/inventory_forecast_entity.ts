// src/inventory/entities/inventory-forecast.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ForecastType {
  DEMAND = 'demand',
  REPLENISHMENT = 'replenishment',
  SEASONALITY = 'seasonality'
}

@Entity('inventory_forecasts')
export class InventoryForecast {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  inventoryId: number;

  @Column()
  sku: string;

  @Column({
    type: 'enum',
    enum: ForecastType
  })
  type: ForecastType;

  @Column({ type: 'date' })
  forecastDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  predictedDemand: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  suggestedStock: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column()
  basedOnDays: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualDemand: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  accuracy: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}