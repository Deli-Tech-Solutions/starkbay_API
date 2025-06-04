import { Injectable } from '@nestjs/common';
import { Request } from 'express';

export interface LocaleDetectionResult {
  locale: string;
  source: 'query' | 'header' | 'cookie' | 'default';
  confidence: number;
}

@Injectable()
export class LocaleDetectionService {
  private readonly supportedLocales = ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja'];
  private readonly defaultLocale = 'en';

  detectLocale(req: Request): LocaleDetectionResult {
    // Priority: Query -> Header -> Cookie -> Default
    const queryLocale = this.getLocaleFromQuery(req);
    if (queryLocale) {
      return {
        locale: queryLocale,
        source: 'query',
        confidence: 1.0,
      };
    }

    const headerLocale = this.getLocaleFromHeader(req);
    if (headerLocale) {
      return {
        locale: headerLocale.locale,
        source: 'header',
        confidence: headerLocale.confidence,
      };
    }

    const cookieLocale = this.getLocaleFromCookie(req);
    if (cookieLocale) {
      return {
        locale: cookieLocale,
        source: 'cookie',
        confidence: 0.8,
      };
    }

    return {
      locale: this.defaultLocale,
      source: 'default',
      confidence: 0.5,
    };
  }

  private getLocaleFromQuery(req: Request): string | null {
    const lang = req.query.lang as string;
    return this.validateLocale(lang);
  }

  private getLocaleFromHeader(req: Request): { locale: string; confidence: number } | null {
    const acceptLanguage = req.headers['accept-language'];
    const customLanguage = req.headers['x-language'] as string;

    if (customLanguage) {
      const validated = this.validateLocale(customLanguage);
      if (validated) {
        return { locale: validated, confidence: 0.95 };
      }
    }

    if (acceptLanguage) {
      const parsed = this.parseAcceptLanguage(acceptLanguage);
      for (const { locale, quality } of parsed) {
        const validated = this.validateLocale(locale);
        if (validated) {
          return { locale: validated, confidence: quality };
        }
      }
    }

    return null;
  }

  private getLocaleFromCookie(req: Request): string | null {
    const cookieLocale = req.cookies?.locale;
    return this.validateLocale(cookieLocale);
  }

  private validateLocale(locale: string): string | null {
    if (!locale) return null;
    
    const normalized = locale.toLowerCase().split('-')[0];
    return this.supportedLocales.includes(normalized) ? normalized : null;
  }

  private parseAcceptLanguage(acceptLanguage: string): Array<{ locale: string; quality: number }> {
    return acceptLanguage
      .split(',')
      .map(lang => {
        const [locale, q] = lang.trim().split(';q=');
        return {
          locale: locale.trim(),
          quality: q ? parseFloat(q) : 1.0,
        };
      })
      .sort((a, b) => b.quality - a.quality);
  }

  getBrowserLocales(req: Request): string[] {
    const acceptLanguage = req.headers['accept-language'];
    if (!acceptLanguage) return [];

    return this.parseAcceptLanguage(acceptLanguage)
      .map(({ locale }) => locale.split('-')[0])
      .filter((locale, index, array) => array.indexOf(locale) === index);
  }
}