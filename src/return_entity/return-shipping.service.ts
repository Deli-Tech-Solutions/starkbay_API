import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from '../entities/return.entity';
import { ReturnStatus } from '../enums/return-status.enum';
import { ShippingService } from '../../shipping/services/shipping.service';

@Injectable()
export class ReturnShippingService {
  constructor(
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
    private shippingService: ShippingService,
  ) {}

  async generateReturnLabel(returnId: string): Promise<{ labelUrl: string, trackingNumber: string }> {
    const returnRequest = await this.returnRepository.findOne({
      where: { id: returnId },
      relations: ['order'],
    });

    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    if (returnRequest.status !== ReturnStatus.APPROVED) {
      throw new Error('Return label can only be generated for approved returns');
    }

    // Generate shipping label
    const label = await this.shippingService.createReturnLabel(
      returnRequest.order.shippingAddress,
      returnRequest.order.id,
    );

    // Update return with tracking info
    returnRequest.trackingNumber = label.trackingNumber;
    returnRequest.shippingCarrier = label.carrier;
    await this.returnRepository.save(returnRequest);

    return {
      labelUrl: label.labelUrl,
      trackingNumber: label.trackingNumber,
    };
  }

  async updateTrackingInfo(returnId: string, trackingNumber: string, carrier: string): Promise<Return> {
    const returnRequest = await this.returnRepository.findOneBy({ id: returnId });

    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    returnRequest.trackingNumber = trackingNumber;
    returnRequest.shippingCarrier = carrier;

    return this.returnRepository.save(returnRequest);
  }

  async markAsReceived(returnId: string): Promise<Return> {
    const returnRequest = await this.returnRepository.findOneBy({ id: returnId });

    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    if (returnRequest.status !== ReturnStatus.APPROVED) {
      throw new Error('Only approved returns can be marked as received');
    }

    returnRequest.status = ReturnStatus.RECEIVED;
    return this.returnRepository.save(returnRequest);
  }
}