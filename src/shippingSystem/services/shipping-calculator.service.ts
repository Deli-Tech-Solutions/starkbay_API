import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingZone } from '../entities/shipping-zone.entity';
import { ShippingMethod } from '../entities/shipping-method.entity';
import { ShippingRate } from '../entities/shipping-rate.entity';
import { CalculateShippingDto } from '../dto/calculate-shipping.dto';

export interface ShippingOption {
  methodId: string;
  name: string;
  carrier: string;
  cost: number;
  estimatedDays: number;
  type: string;
}

@Injectable()
export class ShippingCalculatorService {
  constructor(
    @InjectRepository(ShippingZone)
    private shippingZoneRepository: Repository<ShippingZone>,
    @InjectRepository(ShippingMethod)
    private shippingMethodRepository: Repository<ShippingMethod>,
    @InjectRepository(ShippingRate)
    private shippingRateRepository: Repository<ShippingRate>,
  ) {}

  async calculateShippingOptions(dto: CalculateShippingDto): Promise<ShippingOption[]> {
    const zone = await this.findShippingZone(dto.toAddress);
    if (!zone) {
      throw new Error('No shipping zone found for the destination address');
    }

    const methods = await this.shippingMethodRepository.find({
      where: { isActive: true },
      relations: ['rates'],
    });

    const options: ShippingOption[] = [];

    for (const method of methods) {
      const rate = await this.findApplicableRate(zone.id, method.id, dto.weight);
      if (rate) {
        const cost = await this.calculateCost(method, rate, dto.weight, dto.orderValue);
        
        options.push({
          methodId: method.id,
          name: method.name,
          carrier: method.carrier,
          cost,
          estimatedDays: method.estimatedDays,
          type: method.type,
        });
      }
    }

    return options.sort((a, b) => a.cost - b.cost);
  }

  private async findShippingZone(address: any): Promise<ShippingZone | null> {
    const zones = await this.shippingZoneRepository.find({ where: { isActive: true } });
    
    for (const zone of zones) {
      if (this.isAddressInZone(address, zone)) {
        return zone;
      }
    }
    
    return null;
  }

  private isAddressInZone(address: any, zone: ShippingZone): boolean {
    // Check country
    if (!zone.countries.includes(address.country)) {
      return false;
    }

    // Check state if specified
    if (zone.states && zone.states.length > 0) {
      if (!zone.states.includes(address.state)) {
        return false;
      }
    }

    // Check zip codes if specified
    if (zone.zipCodes && zone.zipCodes.length > 0) {
      const zipMatches = zone.zipCodes.some(zipPattern => {
        return this.matchesZipPattern(address.zipCode, zipPattern);
      });
      if (!zipMatches) {
        return false;
      }
    }

    return true;
  }

  private matchesZipPattern(zipCode: string, pattern: string): boolean {
    // Support wildcard patterns like "90210*" or "902*"
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return zipCode.startsWith(prefix);
    }
    return zipCode === pattern;
  }

  private async findApplicableRate(zoneId: string, methodId: string, weight: number): Promise<ShippingRate | null> {
    return this.shippingRateRepository.findOne({
      where: {
        shippingZone: { id: zoneId },
        shippingMethod: { id: methodId },
      },
    });
  }

  private async calculateCost(method: ShippingMethod, rate: ShippingRate, weight: number, orderValue: number): Promise<number> {
    // Check for free shipping threshold
    if (rate.freeShippingThreshold && orderValue >= rate.freeShippingThreshold) {
      return 0;
    }

    // Base calculation: base cost + (weight * weight multiplier)
    let cost = method.baseCost + (weight * method.weightMultiplier);

    // Add rate-specific cost
    cost += rate.rate;

    return Math.round(cost * 100) / 100; // Round to 2 decimal places
  }
}
