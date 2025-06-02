export interface RateLimitConfig {
  ttl: number;
  limit: number;
  type?: string;
  skipIf?: (context: any) => boolean;
}

export interface RateLimitResponse {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface TrustedClient {
  id: string;
  name: string;
  apiKey: string;
  bypassAll: boolean;
  allowedEndpoints?: string[];
}

export interface RateLimitAnalytics {
  endpoint: string;
  ip: string;
  userId?: string;
  timestamp: Date;
  rateLimited: boolean;
  requestCount: number;
}