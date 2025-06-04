import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { RefundService } from '../services/refund.service';

@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(
    private paymentService: PaymentService,
    private refundService: RefundService,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Body() payload: any,
    @Headers('stripe-signature') signature: string,
  ): Promise<void> {
    // Verify webhook signature
    if (!this.verifyStripeSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    switch (payload.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(payload.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(payload.data.object);
        break;
      case 'charge.dispute.created':
        await this.handleChargeback(payload.data.object);
        break;
      default:
        console.log(`Unhandled Stripe webhook event: ${payload.type}`);
    }
  }

  @Post('paypal')
  @HttpCode(HttpStatus.OK)
  async handlePaypalWebhook(@Body() payload: any): Promise<void> {
    switch (payload.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await this.handlePaymentSuccess(payload.resource);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await this.handlePaymentFailure(payload.resource);
        break;
      default:
        console.log(`Unhandled PayPal webhook event: ${payload.event_type}`);
    }
  }

  private verifyStripeSignature(payload: any, signature: string): boolean {
    // Implement Stripe webhook signature verification
    return true; // Simplified for example
  }

  private async handlePaymentSuccess(paymentData: any): Promise<void> {
    // Update payment status to success
    console.log('Payment succeeded:', paymentData);
  }

  private async handlePaymentFailure(paymentData: any): Promise<void> {
    // Update payment status to failed
    console.log('Payment failed:', paymentData);
  }

  private async handleChargeback(chargebackData: any): Promise<void> {
    // Handle chargeback/dispute
    console.log('Chargeback created:', chargebackData);
  }
}
