import { Injectable, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentSecurityService {
  private readonly maxPaymentAmount = 10000; // Maximum payment amount
  private readonly suspiciousAmounts = [9999.99, 10000.01]; // Flagged amounts

  async validatePayment(paymentData: CreatePaymentDto): Promise<void> {
    // Amount validation
    if (paymentData.amount > this.maxPaymentAmount) {
      throw new BadRequestException('Payment amount exceeds maximum allowed');
    }

    if (this.suspiciousAmounts.includes(paymentData.amount)) {
      throw new BadRequestException('Payment amount flagged for review');
    }

    // Customer validation (basic)
    if (!this.isValidCustomerId(paymentData.customerId)) {
      throw new BadRequestException('Invalid customer ID format');
    }

    // Additional fraud checks would go here
    await this.performFraudCheck(paymentData);
  }

  private isValidCustomerId(customerId: string): boolean {
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(customerId);
  }

  private async performFraudCheck(paymentData: CreatePaymentDto): Promise<void> {
    // Implement fraud detection logic
    // This could include checking against blacklists, velocity checks, etc.
    
    // Example: Check for duplicate payments
    const paymentHash = this.generatePaymentHash(paymentData);
    // In real implementation, check against cache/database for duplicate hashes
  }

  private generatePaymentHash(paymentData: CreatePaymentDto): string {
    const hashString = `${paymentData.customerId}-${paymentData.amount}-${paymentData.orderId}`;
    return crypto.createHash('sha256').update(hashString).digest('hex');
  }

  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  encryptSensitiveData(data: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
  }
}
