import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingZone } from '../entities/shipping-zone.entity';
import { CreateShippingZoneDto, UpdateShippingZoneDto } from '../dto/shipping-zone.dto';

@Injectable()
export class ShippingZoneService {
  constructor(
    @InjectRepository(ShippingZone)
    private shippingZoneRepository: Repository<ShippingZone>,
  ) {}

  async create(dto: CreateShippingZoneDto): Promise<ShippingZone> {
    const zone = this.shippingZoneRepository.create(dto);
    return this.shippingZoneRepository.save(zone);
  }

  async findAll(): Promise<ShippingZone[]> {
    return this.shippingZoneRepository.find({
      relations: ['rates', 'shipments'],
    });
  }

  async findOne(id: string): Promise<ShippingZone> {
    const zone = await this.shippingZoneRepository.findOne({
      where: { id },
      relations: ['rates', 'shipments'],
    });

    if (!zone) {
      throw new NotFoundException('Shipping zone not found');
    }

    return zone;
  }

  async update(id: string, dto: UpdateShippingZoneDto): Promise<ShippingZone> {
    const zone = await this.findOne(id);
    Object.assign(zone, dto);
    return this.shippingZoneRepository.save(zone);
  }

  async remove(id: string): Promise<void> {
    const zone = await this.findOne(id);
    await this.shippingZoneRepository.remove(zone);
  }
}

