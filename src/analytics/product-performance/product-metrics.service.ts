/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/event.entity';

@Injectable()
export class ProductMetricsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async getProductViews(productId: string): Promise<number> {
    const events = await this.eventRepo.find({
      where: { product: { id: productId }, type: 'view_product' },
      relations: ['product'],
    });
    return events.length;
  }
}
