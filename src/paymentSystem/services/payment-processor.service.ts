import { Injectable } from '@nestjs/common';
import { PaymentMethodType } from '../entities/payment-method.entity';
import { StripeProcessorService } from '../processors/stripe-processor.service';
import { PaypalProcessorService } from '../processors/paypal-processor.service';
import { Payment } from '../entities/payment.entity';
import { Refund } from '../entities/refund.entity';

@Injectable()
export class PaymentProcessorService {
  constructor(
    private stripeProcessor: StripeProcessorService,
    private paypalProcessor: PaypalProcessorService,
  ) {}

  async processPayment(payment: Payment): Promise<any> {
    const processor = this.getProcessor(payment.paymentMethod.type);
    return processor.processPayment({
      amount: payment.amount,
      currency: payment.currency,
      customerId: payment.customerId,
      orderId: payment.orderId,
      description: payment.description,
      metadata: payment.metadata
    });
  }

  async processRefund(refund: Refund): Promise<any> {
    const processor = this.getProcessor(refund.payment.paymentMethod.type);
    return processor.processRefund({
      transactionId: refund.payment.transactionId,
      amount: refund.amount,
      reason: refund.reason
    });
  }

  async getPaymentStatus(transactionId: string, paymentMethodType: PaymentMethodType): Promise<any> {
    const processor = this.getProcessor(paymentMethodType);
    return processor.getPaymentStatus(transactionId);
  }

  private getProcessor(type: PaymentMethodType) {
    switch (type) {
      case PaymentMethodType.STRIPE:
      case PaymentMethodType.CREDIT_CARD:
      case PaymentMethodType.DEBIT_CARD:
        return this.stripeProcessor;
      case PaymentMethodType.PAYPAL:
        return this.paypalProcessor;
      default:
        throw new Error(`Unsupported payment method type: ${type}`);
    }
  }
}
