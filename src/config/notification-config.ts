export interface NotificationConfig {
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    from: string;
  };
  sms: {
    apiKey: string;
    apiSecret: string;
    from: string;
  };
  push: {
    vapidPublicKey: string;
    vapidPrivateKey: string;
  };
  scheduling: {
    enabled: boolean;
    maxRetries: number;
    retryInterval: number;
  };
}

export const notificationConfig: NotificationConfig = {
  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.FROM_EMAIL || 'noreply@example.com',
  },
  sms: {
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || '',
    from: process.env.SMS_FROM || 'App',
  },
  push: {
    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  },
  scheduling: {
    enabled: process.env.SCHEDULING_ENABLED === 'true',
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    retryInterval: parseInt(process.env.RETRY_INTERVAL || '300000'),
  },
};