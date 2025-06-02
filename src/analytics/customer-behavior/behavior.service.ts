/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/event.entity';

@Injectable()
export class BehaviorService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async getUserBehavior(userId: string): Promise<Record<string, number>> {
    const events = await this.eventRepo.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    const counts = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return counts;
  }
}
