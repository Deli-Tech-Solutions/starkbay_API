import { Test, TestingModule } from '@nestjs/testing';
import { AddressValidationService } from '../services/address-validation.service';
import { CountryCode } from '../entities/address.entity';

describe('AddressValidationService', () => {
  let service: AddressValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressValidationService],
    }).compile();

    service = module.get<AddressValidationService>(AddressValidationService);
  });

  describe('validateAddress', () => {
    const validUSAddress = {
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      stateProvince: 'CA',
      postalCode: '94105',
      country: CountryCode.US,
    };

    it('should validate a correct US address', async () => {
      const result = await service.validateAddress(validUSAddress);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid US postal code', async () => {
      const invalidAddress = {
        ...validUSAddress,
        postalCode: '123',
      };

      const result = await service.validateAddress(invalidAddress);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid postal code format for US');
    });

    it('should reject missing required fields', async () => {
      const invalidAddress = {
        ...validUSAddress,
        firstName: '',
        lastName: null,
      };

      const result = await service.validateAddress(invalidAddress);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          'First name is required',
          'Last name is required',
        ]),
      );
    });

    it('should validate Canadian postal code format', async () => {
      const canadianAddress = {
        ...validUSAddress,
        country: CountryCode.CA,
        postalCode: 'K1A 0A6',
        stateProvince: 'ON',
      };

      const result = await service.validateAddress(canadianAddress);

      expect(result.isValid).toBe(true);
    });
  });
});