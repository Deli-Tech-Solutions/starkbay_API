import { Module, Global } from '@nestjs/common';
import { AcceptLanguageResolver, I18nModule, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import { join } from 'path';
import { TranslationService } from './services/translation.service';
import { TranslationManagementService } from './services/translation-management.service';
import { LocaleDetectionService } from './services/locale-detection.service';
import { I18nController } from './controllers/i18n.controller';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '/translations/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        { use: HeaderResolver, options: ['x-language'] },
        AcceptLanguageResolver,
      ],
      typesOutputPath: join(__dirname, '../generated/i18n.generated.ts'),
    }),
  ],
  providers: [
    TranslationService,
    TranslationManagementService,
    LocaleDetectionService,
  ],
  controllers: [I18nController],
  exports: [
    TranslationService,
    TranslationManagementService,
    LocaleDetectionService,
  ],
})
export class I18nLanguageModule {}