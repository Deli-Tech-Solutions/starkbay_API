export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  confidence: number;
}

export interface GeocodingService {
  geocodeAddress(address: string): Promise<GeocodingResult | null>;
}

// addressManagement/services/address-validation.service.ts
import { Injectable } from '@nestjs/common';
import { CountryCode } from '../entities/address.entity';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  suggestions?: Partial<any>;
}

@Injectable()
export class AddressValidationService {
  private readonly postalCodePatterns = {
    [CountryCode.US]: /^\d{5}(-\d{4})?$/,
    [CountryCode.CA]: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
    [CountryCode.GB]: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    [CountryCode.DE]: /^\d{5}$/,
    [CountryCode.FR]: /^\d{5}$/,
    [CountryCode.AU]: /^\d{4}$/,
    [CountryCode.JP]: /^\d{3}-\d{4}$/,
  };

  async validateAddress(addressData: any): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate postal code format
    const postalPattern = this.postalCodePatterns[addressData.country];
    if (postalPattern && !postalPattern.test(addressData.postalCode)) {
      errors.push(`Invalid postal code format for ${addressData.country}`);
    }

    // Validate required fields
    if (!addressData.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!addressData.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!addressData.addressLine1?.trim()) {
      errors.push('Address line 1 is required');
    }

    if (!addressData.city?.trim()) {
      errors.push('City is required');
    }

    if (!addressData.stateProvince?.trim()) {
      errors.push('State/Province is required');
    }

    // Country-specific validations
    await this.validateCountrySpecific(addressData, errors);

    return {
      isValid: errors.length === 0,
      errors,
      suggestions: await this.generateSuggestions(addressData, errors)
    };
  }

  private async validateCountrySpecific(addressData: any, errors: string[]): Promise<void> {
    switch (addressData.country) {
      case CountryCode.US:
        await this.validateUSAddress(addressData, errors);
        break;
      case CountryCode.CA:
        await this.validateCanadianAddress(addressData, errors);
        break;
      // Add more country-specific validations
    }
  }

  private async validateUSAddress(addressData: any, errors: string[]): Promise<void> {
    // US state abbreviation validation
    const usStates = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    if (!usStates.includes(addressData.stateProvince.toUpperCase())) {
      errors.push('Invalid US state abbreviation');
    }
  }

  private async validateCanadianAddress(addressData: any, errors: string[]): Promise<void> {
    // Canadian province validation
    const canadianProvinces = [
      'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
    ];

    if (!canadianProvinces.includes(addressData.stateProvince.toUpperCase())) {
      errors.push('Invalid Canadian province abbreviation');
    }
  }

  private async generateSuggestions(addressData: any, errors: string[]): Promise<Partial<any>> {
    const suggestions: any = {};

    // Auto-format postal codes
    if (addressData.country === CountryCode.CA && addressData.postalCode) {
      const formatted = addressData.postalCode.replace(/\s/g, '').toUpperCase();
      if (formatted.length === 6) {
        suggestions.postalCode = `${formatted.slice(0, 3)} ${formatted.slice(3)}`;
      }
    }

    return suggestions;
  }
}