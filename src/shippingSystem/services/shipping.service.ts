import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping, ShippingStatus } from '../entities/shipping.entity';
import { CreateShippingDto } from '../dto/create-shipping.dto';
import { ShippingCalculatorService } from './shipping-calculator.service';
import { DeliveryEstimationService } from './delivery-estimation.service';
import { TrackingService } from './tracking.service';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
    private shippingCalculatorService: ShippingCalculatorService,
    private deliveryEstimationService: DeliveryEstimationService,
    private trackingService: TrackingService,
  ) {}

  async createShipment(dto: CreateShippingDto): Promise<Shipping> {
    // Calculate shipping cost
    const options = await this.shippingCalculatorService.calculateShippingOptions({
      weight: dto.weight,
      dimensions: dto.dimensions,
      fromAddress: dto.fromAddress,
      toAddress: dto.toAddress,
      orderValue: 0, // You might want to get this from the order
    });

    const selectedOption = options.find(opt => opt.methodId === dto.shippingMethodId);
    if (!selectedOption) {
      throw new Error('Selected shipping method not available');
    }

    // Generate tracking number
    const trackingNumber = this.generateTrackingNumber(dto.carrier);

    // Estimate delivery date
    const estimatedDeliveryDate = await this.deliveryEstimationService.estimateDeliveryDate(
      dto.shippingMethodId,
      dto.shippingZoneId
    );

    const shipping = this.shippingRepository.create({
      trackingNumber,
      carrier: dto.carrier,
      cost: selectedOption.cost,
      weight: dto.weight,
      dimensions: dto.dimensions,
      fromAddress: dto.fromAddress,
      toAddress: dto.toAddress,
      estimatedDeliveryDate,
      notes: dto.notes,
      status: ShippingStatus.PENDING,
      order: { id: dto.orderId } as any,
      shippingMethod: { id: dto.shippingMethodId } as any,
      shippingZone: { id: dto.shippingZoneId } as any,
    });

    return this.shippingRepository.save(shipping);
  }

  async findAll(): Promise<Shipping[]> {
    return this.shippingRepository.find({
      relations: ['order', 'shippingMethod', 'shippingZone', 'trackingEvents'],
    });
  }

  async findOne(id: string): Promise<Shipping> {
    const shipping = await this.shippingRepository.findOne({
      where: { id },
      relations: ['order', 'shippingMethod', 'shippingZone', 'trackingEvents'],
    });

    if (!shipping) {
      throw new NotFoundException('Shipment not found');
    }

    return shipping;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipping> {
    return this.trackingService.getTrackingInfo(trackingNumber);
  }

  async updateStatus(id: string, status: ShippingStatus): Promise<Shipping> {
    const shipping = await this.findOne(id);
    shipping.status = status;

    if (status === ShippingStatus.SHIPPED && !shipping.shippedDate) {
      shipping.shippedDate = new Date();
    }

    if (status === ShippingStatus.DELIVERED && !shipping.actualDeliveryDate) {
      shipping.actualDeliveryDate = new Date();
    }

    return this.shippingRepository.save(shipping);
  }

  private generateTrackingNumber(carrier: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const prefix = carrier.substring(0, 3).toUpperCase();
    
    return `${prefix}${timestamp.slice(-6)}${random}`;
  }
}
