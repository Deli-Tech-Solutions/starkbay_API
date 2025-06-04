import { Transform } from 'class-transformer';
import { SanitizationService } from '../services/sanitization.service';

export function Sanitize(options?: any) {
  return Transform(({ value }) => {
    const sanitizationService = new SanitizationService();
    return sanitizationService.sanitizeValue(value, options);
  });
}

export function SanitizeHtml() {
  return Sanitize({ type: 'html' });
}

export function SanitizeString() {
  return Sanitize({ type: 'string' });
}

export function SanitizeEmail() {
  return Sanitize({ type: 'email' });
}