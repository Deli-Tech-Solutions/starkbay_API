import { BadRequestException, NotFoundException } from '@nestjs/common';

export class AddressValidationException extends BadRequestException {
  constructor(errors: string[], suggestions?: any) {
    super({
      message: 'Address validation failed',
      errors,
      suggestions,
    });
  }
}

export class AddressNotFoundException extends NotFoundException {
  constructor(addressId: string) {
    super(`Address with ID ${addressId} not found`);
  }
}

export class DefaultAddressException extends BadRequestException {
  constructor(message: string) {
    super(`Default address error: ${message}`);
  }
}

export class GeocodingException extends BadRequestException {
  constructor(message: string) {
    super(`Geocoding error: ${message}`);
  }
}