export interface AddressConfig {
  geocoding: {
    enabled: boolean;
    provider: 'mock' | 'google' | 'mapbox';
    apiKey?: string;
    timeout: number;
  };
  validation: {
    strictMode: boolean;
    allowedCountries?: string[];
  };
  defaults: {
    country: string;
    autoGeocode: boolean;
  };
}

export const defaultAddressConfig: AddressConfig = {
  geocoding: {
    enabled: true,
    provider: 'mock',
    timeout: 5000,
  },
  validation: {
    strictMode: true,
  },
  defaults: {
    country: 'US',
    autoGeocode: true,
  },
};
