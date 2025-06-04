import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { AddressValidationService } from '../services/address-validation.service';

@Injectable()
export class AddressValidationPipe implements PipeTransform {
  constructor(private readonly validationService: AddressValidationService) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && value) {
      const validation = await this.validationService.validateAddress(value);
      
      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Address validation failed',
          errors: validation.errors,
          suggestions: validation.suggestions,
        });
      }
    }

    return value;
  }
}