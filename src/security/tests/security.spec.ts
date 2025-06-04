import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from '../services/security.service';
import { CsrfProtectionService } from '../services/csrf-protection.service';
import { SecurityLoggerService } from '../services/security-logger.service';
import { SqlInjectionGuard } from '../guards/sql-injection.guard';
import { XssProtectionGuard } from '../guards/xss-protection.guard';
import { AuthenticatedRateLimitGuard } from '../guards/authenticated-rate-limit.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';

describe('Security Module', () => {
  let securityService: SecurityService;
  let csrfService: CsrfProtectionService;
  let securityLogger: SecurityLoggerService;
  let sqlGuard: SqlInjectionGuard;
  let xssGuard: XssProtectionGuard;
  let rateLimitGuard: AuthenticatedRateLimitGuard;

  const mockConfigService = {
    get: jest.fn(() => ({
      csrf: {
        enabled: true,
        secret: 'test-secret',
        cookieName: '_csrf',
        headerName: 'x-csrf-token',
      },
      headers: {
        contentSecurityPolicy: "default-src 'self'",
        xssProtection: true,
        frameOptions: 'DENY',
        contentTypeOptions: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      },
      rateLimit: {
        authenticated: {
          windowMs: 900000,
          max: 100,
        },
        login: {
          windowMs: 900000,
          max: 5,
        },
      },
      inputValidation: {
        maxInputLength: 10000,
        allowedTags: ['p', 'b', 'i', 'u', 'strong', 'em'],
        sqlInjectionPatterns: [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
          /('|(\\x27)|(\\x2D\\x2D)|(%27)|(%2D%2D))/i,
        ],
        xssPatterns: [
          /<script[^>]*>.*?<\/script>/gi,
          /<iframe[^>]*>.*?<\/iframe>/gi,
          /javascript:/gi,
        ],
      },
      logging: {
        logSecurityEvents: true,
        logLevel: 'warn',
        alertThresholds: {
          failedLogins: 5,
          suspiciousPatterns: 10,
        },
      },
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityService,
        CsrfProtectionService,
        SecurityLoggerService,
        SqlInjectionGuard,
        XssProtectionGuard,
        AuthenticatedRateLimitGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    securityService = module.get<SecurityService>(SecurityService);
    csrfService = module.get<CsrfProtectionService>(CsrfProtectionService);
    securityLogger = module.get<SecurityLoggerService>(SecurityLoggerService);
    sqlGuard = module.get<SqlInjectionGuard>(SqlInjectionGuard);
    xssGuard = module.get<XssProtectionGuard>(XssProtectionGuard);
    rateLimitGuard = module.get<AuthenticatedRateLimitGuard>(AuthenticatedRateLimitGuard);
  });

  describe('CSRF Protection Service', () => {
    it('should generate valid tokens', () => {
      const token = csrfService.generateToken();
      expect(token).toHaveLength(64);
      expect(csrfService.isValidTokenFormat(token)).toBe(true);
    });

    it('should validate tokens correctly', () => {
      const token = csrfService.generateToken();
      const isValid = csrfService.validateToken(token, token);
      expect(isValid).toBe(true);
    });

    it('should reject invalid tokens', () => {
      const token1 = csrfService.generateToken();
      const token2 = csrfService.generateToken();
      const isValid = csrfService.validateToken(token1, token2);
      expect(isValid).toBe(false);
    });
  });

  describe('SQL Injection Guard', () => {
    const createMockContext = (query: any, body: any = {}) => ({
      switchToHttp: () => ({
        getRequest: () => ({
          url: '/api/test',
          query,
          body,
          params: {},
        }),
      }),
    }) as ExecutionContext;

    it('should allow safe input', () => {
      const context = createMockContext({ search: 'normal search term' });
      expect(sqlGuard.canActivate(context)).toBe(true);
    });

    it('should block SQL injection attempts', () => {
      const context = createMockContext({ search: "'; DROP TABLE users; --" });
      expect(() => sqlGuard.canActivate(context)).toThrow('Invalid input detected');
    });

    it('should block UNION attacks', () => {
      const context = createMockContext({ id: '1 UNION SELECT * FROM users' });
      expect(() => sqlGuard.canActivate(context)).toThrow('Invalid input detected');
    });

    it('should allow legitimate database-related content', () => {
      const context = createMockContext({ 
        description: 'This product has a select design with premium quality' 
      });
      expect(sqlGuard.canActivate(context)).toBe(true);
    });
  });

  describe('XSS Protection Guard', () => {
    const createMockContext = (query: any, body: any = {}) => ({
      switchToHttp: () => ({
        getRequest: () => ({
          url: '/api/test',
          query,
          body,
          params: {},
        }),
      }),
    }) as ExecutionContext;

    it('should allow safe input', () => {
      const context = createMockContext({ comment: 'This is a normal comment' });
      expect(xssGuard.canActivate(context)).toBe(true);
    });

    it('should block script tags', () => {
      const context = createMockContext({ 
        comment: '<script>alert("xss")</script>' 
      });
      expect(() => xssGuard.canActivate(context)).toThrow('Invalid input detected');
    });

    it('should block iframe tags', () => {
      const context = createMockContext({ 
        content: '<iframe src="malicious.com"></iframe>' 
      });
      expect(() => xssGuard.canActivate(context)).toThrow('Invalid input detected');
    });

    it('should block javascript URLs', () => {
      const context = createMockContext({ 
        link: 'javascript:alert("xss")' 
      });
      expect(() => xssGuard.canActivate(context)).toThrow('Invalid input detected');
    });

    it('should sanitize input correctly', () => {
      const input = '<script>alert("test")</script><p>Safe content</p>';
      const sanitized = xssGuard.sanitizeInput(input);
      expect(sanitized).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;&lt;p&gt;Safe content&lt;&#x2F;p&gt;');
    });
  });

  describe('Security Service', () => {
    it('should validate safe input', () => {
      const result = securityService.validateInput('normal text input');
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect SQL injection patterns', () => {
      const result = securityService.validateInput("'; DROP TABLE users; --");
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('Potential SQL injection detected');
    });

    it('should detect XSS patterns', () => {
      const result = securityService.validateInput('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('Potential XSS detected');
    });

    it('should detect input length violations', () => {
      const longInput = 'a'.repeat(10001);
      const result = securityService.validateInput(longInput);
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('Input exceeds maximum length');
    });
  });

  describe('Authenticated Rate Limit Guard', () => {
    const createMockContext = (url: string, user?: any) => ({
      switchToHttp: () => ({
        getRequest: () => ({
          url,
          user,
          ip: '127.0.0.1',
          headers: {},
        }),
      }),
    }) as ExecutionContext;

    it('should allow requests under limit', () => {
      const context = createMockContext('/api/test', { id: 'user1' });
      expect(rateLimitGuard.canActivate(context)).toBe(true);
    });

    it('should skip rate limiting for health checks', () => {
      const context = createMockContext('/health');
      expect(rateLimitGuard.canActivate(context)).toBe(true);
    });

    it('should use different limits for login endpoints', () => {
      const context = createMockContext('/auth/login');
      // First few requests should pass
      for (let i = 0; i < 5; i++) {
        expect(rateLimitGuard.canActivate(context)).toBe(true);
      }
      // Next request should fail
      expect(() => rateLimitGuard.canActivate(context)).toThrow();
    });
  });

  describe('Security Logger Service', () => {
    it('should log SQL injection attempts', () => {
      const mockRequest = {
        url: '/api/test',
        method: 'POST',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      };

      const logSpy = jest.spyOn(securityLogger as any, 'logSecurityEvent');
      securityLogger.logSqlInjectionAttempt(mockRequest, 'malicious payload');
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SQL_INJECTION',
          severity: 'HIGH',
          ip: '127.0.0.1',
        })
      );
    });

    it('should log XSS attempts', () => {
      const mockRequest = {
        url: '/api/test',
        method: 'POST',
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      };

      const logSpy = jest.spyOn(securityLogger as any, 'logSecurityEvent');
      securityLogger.logXssAttempt(mockRequest, '<script>alert("xss")</script>');
      
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'XSS_ATTEMPT',
          severity: 'HIGH',
        })
      );
    });

    it('should sanitize payloads for logging', () => {
      const payload = 'test<script>alert("dangerous")</script>content';
      const sanitized = (securityLogger as any).sanitizeForLogging(payload);
      
      expect(sanitized).toBe('test[FILTERED]script[FILTERED]alert([FILTERED]dangerous[FILTERED])[FILTERED]/script[FILTERED]content');
    });
  });
}); 