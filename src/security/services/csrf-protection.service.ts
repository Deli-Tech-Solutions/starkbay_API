import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityConfig } from '../config/security.config';
import * as crypto from 'crypto';

@Injectable()
export class CsrfProtectionService {
  private securityConfig: SecurityConfig;

  constructor(private configService: ConfigService) {
    this.securityConfig = this.configService.get<SecurityConfig>('security');
  }

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(sessionToken, 'hex')
    );
  }

  createTokenHash(token: string): string {
    return crypto
      .createHmac('sha256', this.securityConfig.csrf.secret)
      .update(token)
      .digest('hex');
  }

  isValidTokenFormat(token: string): boolean {
    // Check if token is 64 character hex string
    return /^[a-f0-9]{64}$/i.test(token);
  }

  getTokenFromRequest(req: any): string | null {
    // Check header first
    const headerToken = req.headers[this.securityConfig.csrf.headerName.toLowerCase()];
    if (headerToken) {
      return headerToken;
    }

    // Check body
    const bodyToken = req.body?._csrf;
    if (bodyToken) {
      return bodyToken;
    }

    // Check query
    const queryToken = req.query?._csrf;
    if (queryToken) {
      return queryToken;
    }

    return null;
  }
} 