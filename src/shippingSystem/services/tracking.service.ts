import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipping, ShippingStatus } from '../entities/shipping.entity';
import { TrackingEvent, TrackingEventType } from '../entities/tracking-event.entity';
import { UpdateTrackingDto } from '../dto/update-tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Shipping)
    private shippingRepository: Repository<Shipping>,
    @InjectRepository(TrackingEvent)
    private trackingEventRepository: Repository<TrackingEvent>,
  ) {}

  async updateTracking(trackingNumber: string, dto: UpdateTrackingDto): Promise<void> {
    const shipping = await this.shippingRepository.findOne({
      where: { trackingNumber },
    });

    if (!shipping) {
      throw new NotFoundException('Shipment not found');
    }

    // Create tracking event
    const trackingEvent = this.trackingEventRepository.create({
      eventType: dto.eventType,
      description: dto.description,
      location: dto.location,
      timestamp: new Date(),
      shipping,
    });

    await this.trackingEventRepository.save(trackingEvent);

    // Update shipping status based on event type
    const newStatus = this.mapEventTypeToStatus(dto.eventType);
    if (newStatus !== shipping.status) {
      shipping.status = newStatus;
      
      if (newStatus === ShippingStatus.DELIVERED) {
        shipping.actualDeliveryDate = new Date();
      }
      
      await this.shippingRepository.save(shipping);
    }
  }

  async getTrackingInfo(trackingNumber: string): Promise<Shipping> {
    const shipping = await this.shippingRepository.findOne({
      where: { trackingNumber },
      relations: ['trackingEvents', 'order', 'shippingMethod'],
    });

    if (!shipping) {
      throw new NotFoundException('Shipment not found');
    }

    return shipping;
  }

  async getTrackingHistory(trackingNumber: string): Promise<TrackingEvent[]> {
    const shipping = await this.shippingRepository.findOne({
      where: { trackingNumber },
    });

    if (!shipping) {
      throw new NotFoundException('Shipment not found');
    }

    return this.trackingEventRepository.find({
      where: { shipping: { id: shipping.id } },
      order: { timestamp: 'ASC' },
    });
  }

  private mapEventTypeToStatus(eventType: TrackingEventType): ShippingStatus {
    const mapping = {
      [TrackingEventType.CREATED]: ShippingStatus.PENDING,
      [TrackingEventType.PICKED_UP]: ShippingStatus.SHIPPED,
      [TrackingEventType.IN_TRANSIT]: ShippingStatus.IN_TRANSIT,
      [TrackingEventType.OUT_FOR_DELIVERY]: ShippingStatus.OUT_FOR_DELIVERY,
      [TrackingEventType.DELIVERED]: ShippingStatus.DELIVERED,
      [TrackingEventType.EXCEPTION]: ShippingStatus.FAILED,
      [TrackingEventType.RETURNED]: ShippingStatus.RETURNED,
    };

    return mapping[eventType] || ShippingStatus.PENDING;
  }
}