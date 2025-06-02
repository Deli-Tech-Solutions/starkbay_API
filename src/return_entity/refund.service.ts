import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Return } from '../entities/return.entity';
import { ProcessRefundDto } from '../dto/process-refund.dto';
import { PaymentService } from '../../payment/services/payment.service';
import { ReturnStatus } from '../enums/return-status.enum';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Return)
    private returnRepository: Repository<Return>,
    private paymentService: PaymentService,
  ) {}

  async calculateRefundAmount(returnId: string): Promise<number> {
    const returnRequest = await this.returnRepository.findOne({
      where: { id: returnId },
      relations: ['items', 'items.orderItem'],
    });

    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    // Calculate refund amount based on items and potentially shipping
    let refundAmount = 0;
    returnRequest.items.forEach(item => {
      refundAmount += item.quantity * item.price;
    });

    // Apply any business rules (e.g., restocking fees)
    if (returnRequest.reason === ReturnReason.CHANGE_OF_MIND) {
      refundAmount *= 0.9; // 10% restocking fee
    }

    return refundAmount;
  }

  async processRefund(returnId: string, processRefundDto: ProcessRefundDto): Promise<Return> {
    const returnRequest = await this.returnRepository.findOne({
      where: { id: returnId },
      relations: ['order'],
    });

    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    if (returnRequest.status !== ReturnStatus.RECEIVED) {
      throw new Error('Refund can only be processed for received returns');
    }

    // Calculate or use provided refund amount
    const refundAmount = processRefundDto.amount || await this.calculateRefundAmount(returnId);

    // Process refund with payment provider
    const refundResult = await this.paymentService.processRefund(
      returnRequest.order.paymentId,
      refundAmount,
      `Refund for return ${returnId}`,
    );

    // Update return status
    returnRequest.refundAmount = refundAmount;
    returnRequest.refundId = refundResult.id;
    returnRequest.status = ReturnStatus.REFUNDED;
    returnRequest.completedAt = new Date();

    return this.returnRepository.save(returnRequest);
  }
}