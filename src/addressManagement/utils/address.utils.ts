import { COUNTRY_CONFIGS } from '../constants/countries';
import { CountryCode } from '../entities/address.entity';

export class AddressUtils {
  static formatPostalCode(postalCode: string, country: CountryCode): string {
    const config = COUNTRY_CONFIGS[country];
    if (!config) return postalCode;

    switch (country) {
      case CountryCode.CA:
        // Format Canadian postal codes as "A1A 1A1"
        const cleanCode = postalCode.replace(/\s/g, '').toUpperCase();
        if (cleanCode.length === 6) {
          return `${cleanCode.slice(0, 3)} ${cleanCode.slice(3)}`;
        }
        break;
      case CountryCode.US:
        // Format US ZIP codes as "12345" or "12345-6789"
        const cleanZip = postalCode.replace(/\D/g, '');
        if (cleanZip.length === 9) {
          return `${cleanZip.slice(0, 5)}-${cleanZip.slice(5)}`;
        }
        break;
    }

    return postalCode;
  }

  static getCountryConfig(country: CountryCode) {
    return COUNTRY_CONFIGS[country];
  }

  static validatePostalCode(postalCode: string, country: CountryCode): boolean {
    const config = COUNTRY_CONFIGS[country];
    if (!config?.postalCodePattern) return true;

    return config.postalCodePattern.test(postalCode);
  }

  static formatFullAddress(address: any): string {
    const parts = [];

    if (address.company) parts.push(address.company);
    
    parts.push(`${address.firstName} ${address.lastName}`);
    parts.push(address.addressLine1);
    
    if (address.addressLine2) parts.push(address.addressLine2);
    
    parts.push(`${address.city}, ${address.stateProvince} ${address.postalCode}`);
    
    const countryConfig = COUNTRY_CONFIGS[address.country];
    if (countryConfig) {
      parts.push(countryConfig.name);
    }

    return parts.join('\n');
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
