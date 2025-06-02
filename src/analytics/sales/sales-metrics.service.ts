/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Event } from '../events/event.entity';

@Injectable()
export class SalesMetricsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async getTotalSales(from: Date, to: Date): Promise<number> {
    const purchases = await this.eventRepo.find({
      where: {
        type: 'purchase',
        createdAt: Between(from, to),
      },
    });
    return purchases.length;
  }
}
