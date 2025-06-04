export interface PaymentConfig {
  stripe: {
    publicKey: string;
    secretKey: string;
    webhookSecret: string;
    apiVersion: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    mode: 'sandbox' | 'live';
  };
  security: {
    maxPaymentAmount: number;
    encryptionKey: string;
    tokenExpiry: number;
  };
  audit: {
    enabled: boolean;
    retentionDays: number;
  };
}

export const paymentConfig: PaymentConfig = {
  stripe: {
    publicKey: process.env.STRIPE_PUBLIC_KEY || '',
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    apiVersion: '2023-10-16'
  },
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    mode: (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox'
  },
  security: {
    maxPaymentAmount: Number(process.env.MAX_PAYMENT_AMOUNT) || 10000,
    encryptionKey: process.env.PAYMENT_ENCRYPTION_KEY || 'default-key',
    tokenExpiry: Number(process.env.PAYMENT_TOKEN_EXPIRY) || 3600
  },
  audit: {
    enabled: process.env.PAYMENT_AUDIT_ENABLED === 'true',
    retentionDays: Number(process.env.PAYMENT_AUDIT_RETENTION_DAYS) || 365
  }
};