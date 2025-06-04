import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata, 
  BadRequestException 
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';
import { ValidationErrorFormatterService } from '../services/validation-error-formatter.service';
import { SanitizationService } from '../services/sanitization.service';
import { ValidationCacheService } from '../services/validation-cache.service';
import { ValidationOptions } from '../interfaces/validation.interface';

@Injectable()
export class GlobalValidationPipe implements PipeTransform<any> {
  constructor(
    private readonly errorFormatter: ValidationErrorFormatterService,
    private readonly sanitizationService: SanitizationService,
    private readonly cacheService: ValidationCacheService,
    private readonly options?: ValidationOptions
  ) {}

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize input data
    const sanitizedValue = this.options?.sanitize !== false 
      ? this.sanitizationService.sanitizeValue(value)
      : value;

    // Check cache first
    const cacheKey = this.cacheService.generateCacheKey(sanitizedValue, this.options);
    const cachedResult = await this.cacheService.getCachedValidation(cacheKey);
    
    if (cachedResult && cachedResult.isValid) {
      return cachedResult.sanitizedData || sanitizedValue;
    }

    // Transform plain object to class instance
    const object = plainToClass(metatype, sanitizedValue, {
      enableImplicitConversion: true,
      excludeExtraneousValues: this.options?.whitelist || false
    });

    // Validate
    const errors = await validate(object, {
      skipMissingProperties: this.options?.skipMissingProperties || false,
      whitelist: this.options?.whitelist || false,
      forbidNonWhitelisted: this.options?.forbidNonWhitelisted || false,
      groups: this.options?.groups,
      dismissDefaultMessages: false,
      validationError: {
        target: false,
        value: false
      }
    });

    if (errors.length > 0) {
      const validationResult = {
        isValid: false,
        errors: this.errorFormatter.extractErrorMessages(errors),
        sanitizedData: sanitizedValue
      };

      // Cache the validation result
      await this.cacheService.setCachedValidation(cacheKey, validationResult);

      const formattedErrors = this.errorFormatter.formatErrorsFlat(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
        userMessage: this.errorFormatter.createUserFriendlyMessage(errors)
      });
    }

    // Cache successful validation
    const validationResult = {
      isValid: true,
      errors: [],
      sanitizedData: object
    };
    await this.cacheService.setCachedValidation(cacheKey, validationResult);

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
