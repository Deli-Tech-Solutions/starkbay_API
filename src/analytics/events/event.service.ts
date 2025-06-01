/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from '../dto/event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async trackEvent(dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create({
      ...dto,
      type: dto.type as Event['type'],
      product: dto.product ? { id: dto.product } : undefined,
      user: dto.user ? { id: dto.user } : undefined,
    });
    return this.eventRepo.save(event);
  }

  async getEvents(filter: Partial<Event>): Promise<Event[]> {
    return this.eventRepo.find({ where: filter });
  }
}
