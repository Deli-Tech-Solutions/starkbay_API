import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { TranslationService } from '../services/translation.service';
import { TranslationManagementService, TranslationEntry } from '../services/translation-management.service';
import { LocaleDetectionService } from '../services/locale-detection.service';

@Controller('i18n')
export class I18nController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly managementService: TranslationManagementService,
    private readonly localeService: LocaleDetectionService,
  ) {}

  @Get('detect')
  detectLocale(@Req() req: Request) {
    return this.localeService.detectLocale(req);
  }

  @Get('locales')
  getSupportedLocales() {
    return {
      locales: this.translationService.getSupportedLocales(),
      rtlLocales: this.translationService.getSupportedLocales()
        .filter(locale => this.translationService.isRTLLanguage(locale)),
    };
  }

  @Get('translate/:key')
  translate(
    @Param('key') key: string,
    @Query('locale') locale?: string,
    @Query('count') count?: string,
  ) {
    const options = {
      locale,
      count: count ? parseInt(count, 10) : undefined,
    };

    return {
      key,
      translation: this.translationService.translate(key, options),
      locale: options.locale,
    };
  }

  @Get('stats/:locale')
  async getTranslationStats(@Param('locale') locale: string) {
    return await this.managementService.getTranslationStats(locale);
  }

  @Post('translations')
  async addTranslation(@Body() entry: TranslationEntry) {
    await this.managementService.addTranslation(entry);
    return { success: true };
  }

  @Delete('translations/:locale/:key')
  async removeTranslation(
    @Param('locale') locale: string,
    @Param('key') key: string,
  ) {
    await this.managementService.removeTranslation(key, locale);
    return { success: true };
  }

  @Get('export/:locale')
  async exportTranslations(
    @Param('locale') locale: string,
    @Query('format') format: 'json' | 'csv' = 'json',
  ) {
    const data = await this.managementService.exportTranslations(locale, format);
    return { data };
  }

  @Post('import/:locale')
  async importTranslations(
    @Param('locale') locale: string,
    @Body('data') data: string,
    @Body('format') format: 'json' | 'csv' = 'json',
  ) {
    await this.managementService.importTranslations(locale, data, format);
    return { success: true };
  }
}