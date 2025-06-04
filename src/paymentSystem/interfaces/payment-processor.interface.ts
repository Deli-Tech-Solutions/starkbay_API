export interface PaymentProcessorInterface {
  processPayment(paymentData: any): Promise<any>;
  processRefund(refundData: any): Promise<any>;
  getPaymentStatus(transactionId: string): Promise<any>;
}

