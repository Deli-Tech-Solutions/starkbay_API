import { registerAs } from '@nestjs/config';

export interface SecurityConfig {
  csrf: {
    enabled: boolean;
    secret: string;
    cookieName: string;
    headerName: string;
  };
  headers: {
    contentSecurityPolicy: string;
    xssProtection: boolean;
    frameOptions: string;
    contentTypeOptions: boolean;
    referrerPolicy: string;
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  rateLimit: {
    authenticated: {
      windowMs: number;
      max: number;
    };
    login: {
      windowMs: number;
      max: number;
    };
  };
  inputValidation: {
    maxInputLength: number;
    allowedTags: string[];
    sqlInjectionPatterns: RegExp[];
    xssPatterns: RegExp[];
  };
  logging: {
    logSecurityEvents: boolean;
    logLevel: string;
    alertThresholds: {
      failedLogins: number;
      suspiciousPatterns: number;
    };
  };
}

export default registerAs('security', (): SecurityConfig => ({
  csrf: {
    enabled: process.env.CSRF_ENABLED !== 'false',
    secret: process.env.CSRF_SECRET || 'your-csrf-secret-key',
    cookieName: process.env.CSRF_COOKIE_NAME || '_csrf',
    headerName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
  },
  headers: {
    contentSecurityPolicy: process.env.CSP_POLICY || "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'",
    xssProtection: process.env.XSS_PROTECTION !== 'false',
    frameOptions: process.env.FRAME_OPTIONS || 'DENY',
    contentTypeOptions: process.env.CONTENT_TYPE_OPTIONS !== 'false',
    referrerPolicy: process.env.REFERRER_POLICY || 'strict-origin-when-cross-origin',
    hsts: {
      maxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'),
      includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS !== 'false',
      preload: process.env.HSTS_PRELOAD !== 'false',
    },
  },
  rateLimit: {
    authenticated: {
      windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100'),
    },
    login: {
      windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
      max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),
    },
  },
  inputValidation: {
    maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH || '10000'),
    allowedTags: (process.env.ALLOWED_HTML_TAGS || 'p,b,i,u,strong,em').split(','),
    sqlInjectionPatterns: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\\x27)|(\')|(\\x22)|(\"))/i,
      /((\\x3C)|<)[^\n]*((\%3E)|(>))/i,
    ],
    xssPatterns: [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ],
  },
  logging: {
    logSecurityEvents: process.env.LOG_SECURITY_EVENTS !== 'false',
    logLevel: process.env.SECURITY_LOG_LEVEL || 'warn',
    alertThresholds: {
      failedLogins: parseInt(process.env.FAILED_LOGIN_THRESHOLD || '5'),
      suspiciousPatterns: parseInt(process.env.SUSPICIOUS_PATTERN_THRESHOLD || '10'),
    },
  },
})); 