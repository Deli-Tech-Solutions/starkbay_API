import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { EventStatus } from '../types/event.types';

@Entity('event_store')
@Index(['eventType'])
@Index(['aggregateId'])
@Index(['createdAt'])
@Index(['status'])
export class EventStoreEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'event_type' })
  eventType: string;

  @Column({ name: 'aggregate_id' })
  aggregateId: string;

  @Column()
  version: string;

  @Column('jsonb')
  payload: any;

  @Column('jsonb')
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING
  })
  status: EventStatus;
}