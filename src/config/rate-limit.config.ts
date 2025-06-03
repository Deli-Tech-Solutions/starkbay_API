import { registerAs } from '@nestjs/config';
import { RateLimitType } from '../rate-limiting/enums/rate-limit-type.enum';

export default registerAs('rateLimit', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  
  defaultLimits: {
    [RateLimitType.STRICT]: { ttl: 60, limit: 10 },
    [RateLimitType.MODERATE]: { ttl: 60, limit: 50 },
    [RateLimitType.LENIENT]: { ttl: 60, limit: 100 }
  },
  
  endpointLimits: {
    '/auth/login': { ttl: 900, limit: 5, type: RateLimitType.STRICT },
    '/auth/register': { ttl: 3600, limit: 3, type: RateLimitType.STRICT },
    '/auth/forgot-password': { ttl: 3600, limit: 3, type: RateLimitType.STRICT },
    '/api/users': { ttl: 60, limit: 100, type: RateLimitType.MODERATE },
    '/api/posts': { ttl: 60, limit: 200, type: RateLimitType.LENIENT },
    '/api/search': { ttl: 60, limit: 30, type: RateLimitType.MODERATE }
  },
  
  trustedClients: [
    {
      id: 'admin-client-1',
      name: 'Admin Dashboard',
      apiKey: process.env.ADMIN_API_KEY || 'admin-key-123',
      bypassAll: true
    },
    {
      id: 'monitoring-client',
      name: 'Monitoring Service',
      apiKey: process.env.MONITORING_API_KEY || 'monitor-key-456',
      bypassAll: false,
      allowedEndpoints: ['/health', '/metrics']
    }
  ]
}));


