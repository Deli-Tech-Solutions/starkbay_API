import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingMethod } from '../entities/shipping-method.entity';
import { ShippingZone } from '../entities/shipping-zone.entity';

@Injectable()
export class DeliveryEstimationService {
  constructor(
    @InjectRepository(ShippingMethod)
    private shippingMethodRepository: Repository<ShippingMethod>,
    @InjectRepository(ShippingZone)
    private shippingZoneRepository: Repository<ShippingZone>,
  ) {}

  async estimateDeliveryDate(methodId: string, zoneId: string, shipDate?: Date): Promise<Date> {
    const method = await this.shippingMethodRepository.findOne({
      where: { id: methodId },
    });

    if (!method) {
      throw new Error('Shipping method not found');
    }

    const baseDate = shipDate || new Date();
    const deliveryDate = new Date(baseDate);
    
    // Add estimated days
    deliveryDate.setDate(deliveryDate.getDate() + method.estimatedDays);
    
    // Skip weekends for business deliveries
    deliveryDate = this.adjustForWeekends(deliveryDate);
    
    // Consider holidays (basic implementation)
    deliveryDate = this.adjustForHolidays(deliveryDate);

    return deliveryDate;
  }

  private adjustForWeekends(date: Date): Date {
    const dayOfWeek = date.getDay();
    
    // If Saturday (6), move to Monday
    if (dayOfWeek === 6) {
      date.setDate(date.getDate() + 2);
    }
    // If Sunday (0), move to Monday
    else if (dayOfWeek === 0) {
      date.setDate(date.getDate() + 1);
    }
    
    return date;
  }

  private adjustForHolidays(date: Date): Date {
    // Basic holiday checking - in real implementation, use a holiday API
    const year = date.getFullYear();
    const holidays = [
      new Date(year, 0, 1),  // New Year's Day
      new Date(year, 6, 4),  // Independence Day
      new Date(year, 11, 25), // Christmas
    ];

    for (const holiday of holidays) {
      if (this.isSameDay(date, holiday)) {
        date.setDate(date.getDate() + 1);
        // Recursively check the new date
        return this.adjustForHolidays(date);
      }
    }

    return date;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}
