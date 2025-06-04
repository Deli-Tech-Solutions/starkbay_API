import { Injectable } from '@nestjs/common';
import { Shipping, ShippingStatus } from '../entities/shipping.entity';

export interface NotificationData {
  to: string;
  subject: string;
  message: string;
  trackingNumber: string;
  estimatedDelivery?: Date;
}

@Injectable()
export class NotificationService {
  async sendShippingNotification(shipping: Shipping, status: ShippingStatus): Promise<void> {
    const notification = this.buildNotification(shipping, status);
    
    // In a real implementation, integrate with email/SMS service
    console.log('Sending notification:', notification);
    
    // Example integration points:
    // - SendGrid for email
    // - Twilio for SMS
    // - Push notifications for mobile apps
  }

  private buildNotification(shipping: Shipping, status: ShippingStatus): NotificationData {
    const baseData: NotificationData = {
      to: 'customer@example.com', // Get from order/customer data
      trackingNumber: shipping.trackingNumber,
      subject: '',
      message: '',
    };

    switch (status) {
      case ShippingStatus.SHIPPED:
        baseData.subject = 'Your order has been shipped!';
        baseData.message = `Your order has been shipped via ${shipping.carrier}. Track your package: ${shipping.trackingNumber}`;
        baseData.estimatedDelivery = shipping.estimatedDeliveryDate;
        break;
        
      case ShippingStatus.OUT_FOR_DELIVERY:
        baseData.subject = 'Your package is out for delivery';
        baseData.message = `Your package is out for delivery and should arrive today. Tracking: ${shipping.trackingNumber}`;
        break;
        
      case ShippingStatus.DELIVERED:
        baseData.subject = 'Your package has been delivered';
        baseData.message = `Your package has been successfully delivered. Thank you for your order!`;
        break;
        
      case ShippingStatus.FAILED:
        baseData.subject = 'Delivery attempt failed';
        baseData.message = `We were unable to deliver your package. Please check tracking for details: ${shipping.trackingNumber}`;
        break;
        
      default:
        baseData.subject = 'Shipping update';
        baseData.message = `Your shipment status has been updated. Tracking: ${shipping.trackingNumber}`;
    }

    return baseData;
  }
}
