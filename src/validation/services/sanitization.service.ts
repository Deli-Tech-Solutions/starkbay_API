import { Injectable } from '@nestjs/common';
import * as DOMPurify from 'dompurify';
import * as xss from 'xss';
import * as validator from 'validator';
import { SANITIZATION_OPTIONS } from '../constants/validation.constants';

@Injectable()
export class SanitizationService {
  sanitizeValue(value: any, options?: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value, options);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item, options));
    }

    if (typeof value === 'object') {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val, options);
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(value: string, options?: any): string {
    if (!value) return value;

    let sanitized = value;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    switch (options?.type) {
      case 'html':
        sanitized = this.sanitizeHtml(sanitized);
        break;
      case 'email':
        sanitized = this.sanitizeEmail(sanitized);
        break;
      case 'url':
        sanitized = this.sanitizeUrl(sanitized);
        break;
      default:
        sanitized = this.sanitizeGeneral(sanitized);
    }

    return sanitized;
  }

  private sanitizeHtml(value: string): string {
    // Use DOMPurify for HTML sanitization
    return DOMPurify.sanitize(value, {
      FORBID_TAGS: SANITIZATION_OPTIONS.FORBID_TAGS,
      FORBID_ATTR: SANITIZATION_OPTIONS.FORBID_ATTR,
      ALLOW_DATA_ATTR: SANITIZATION_OPTIONS.ALLOW_DATA_ATTR
    });
  }

  private sanitizeEmail(value: string): string {
    return validator.normalizeEmail(value) || value;
  }

  private sanitizeUrl(value: string): string {
    try {
      const url = new URL(value);
      return url.toString();
    } catch {
      return '';
    }
  }

  private sanitizeGeneral(value: string): string {
    // Remove potentially dangerous characters
    return xss(value, {
      whiteList: {},
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  }

  sanitizeObject(obj: any, whitelist?: string[]): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sanitized = {};
    const allowedKeys = whitelist || Object.keys(obj);

    for (const key of allowedKeys) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = this.sanitizeValue(obj[key]);
      }
    }

    return sanitized;
  }
}
