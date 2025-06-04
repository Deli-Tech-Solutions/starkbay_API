import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { I18nValidationException, I18nContext } from 'nestjs-i18n';

@Catch(I18nValidationException)
export class I18nValidationExceptionFilter implements ExceptionFilter {
  catch(exception: I18nValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const i18n = I18nContext.current(host);

    const errors = exception.errors?.map(error => ({
      property: error.property,
      constraints: Object.values(error.constraints || {}).map(constraint =>
        i18n?.translate(`validation.${constraint}`) || constraint
      ),
    }));

    response.status(400).json({
      statusCode: 400,
      message: i18n?.translate('validation.failed') || 'Validation failed',
      errors,
    });
  }
}