import { Injectable } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

export interface TranslationOptions {
  args?: Record<string, any>;
  count?: number;
  locale?: string;
}

@Injectable()
export class TranslationService {
  constructor(private readonly i18n: I18nService) {}

  translate(key: string, options?: TranslationOptions): string {
    const locale = options?.locale || I18nContext.current()?.lang || 'en';
    
    if (options?.count !== undefined) {
      return this.translateWithPluralization(key, options.count, locale, options.args);
    }

    return this.i18n.translate(key, {
      lang: locale,
      args: options?.args,
    });
  }

  private translateWithPluralization(
    key: string,
    count: number,
    locale: string,
    args?: Record<string, any>
  ): string {
    const pluralKey = this.getPluralKey(key, count, locale);
    return this.i18n.translate(pluralKey, {
      lang: locale,
      args: { ...args, count },
    });
  }

  private getPluralKey(key: string, count: number, locale: string): string {
    const rules = this.getPluralRules(locale);
    const rule = rules(count);
    
    return `${key}.${rule}`;
  }

  private getPluralRules(locale: string): (count: number) => string {
    const intl = new Intl.PluralRules(locale);
    return (count: number) => intl.select(count);
  }

  getSupportedLocales(): string[] {
    return ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja'];
  }

  isRTLLanguage(locale: string): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(locale.toLowerCase());
  }

  formatNumber(value: number, locale?: string): string {
    const currentLocale = locale || I18nContext.current()?.lang || 'en';
    return new Intl.NumberFormat(currentLocale).format(value);
  }

  formatDate(date: Date, locale?: string, options?: Intl.DateTimeFormatOptions): string {
    const currentLocale = locale || I18nContext.current()?.lang || 'en';
    return new Intl.DateTimeFormat(currentLocale, options).format(date);
  }

  formatCurrency(amount: number, currency: string, locale?: string): string {
    const currentLocale = locale || I18nContext.current()?.lang || 'en';
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency,
    }).format(amount);
  }
}