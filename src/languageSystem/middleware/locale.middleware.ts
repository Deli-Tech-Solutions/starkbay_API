import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LocaleDetectionService } from '../services/locale-detection.service';
import { TranslationService } from '../services/translation.service';

@Injectable()
export class LocaleMiddleware implements NestMiddleware {
  constructor(
    private readonly localeService: LocaleDetectionService,
    private readonly translationService: TranslationService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const detection = this.localeService.detectLocale(req);
    
    // Set locale in request for later use
    req['locale'] = detection.locale;
    req['localeSource'] = detection.source;
    
    // Set response headers for client-side use
    res.setHeader('X-Detected-Language', detection.locale);
    res.setHeader('X-Language-Source', detection.source);
    res.setHeader('X-Language-Direction', 
      this.translationService.isRTLLanguage(detection.locale) ? 'rtl' : 'ltr'
    );
    
    // Set cookie if not present and detected from other sources
    if (detection.source !== 'cookie') {
      res.cookie('locale', detection.locale, {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false, // Allow client-side access
        sameSite: 'lax',
      });
    }
    
    next();
  }
}