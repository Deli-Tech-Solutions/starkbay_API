import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SanitizationService } from '../services/sanitization.service';

@Injectable()
export class SanitizationMiddleware implements NestMiddleware {
  constructor(private readonly sanitizationService: SanitizationService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = this.sanitizationService.sanitizeValue(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = this.sanitizationService.sanitizeValue(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = this.sanitizationService.sanitizeValue(req.params);
    }

    next();
  }
}
