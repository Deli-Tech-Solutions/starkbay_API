import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AddressService } from '../services/address.service';
import { AddressValidationService } from '../services/address-validation.service';
import { MockGeocodingService } from '../services/geocoding.service';
import { Address, AddressType, CountryCode } from '../entities/address.entity';

describe('AddressService', () => {
  let service: AddressService;
  let repository: Repository<Address>;
  let validationService: AddressValidationService;
  let geocodingService: MockGeocodingService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    })),
  };

  const mockValidationService = {
    validateAddress: jest.fn(),
  };

  const mockGeocodingService = {
    geocodeAddress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddressService,
        {
          provide: getRepositoryToken(Address),
          useValue: mockRepository,
        },
        {
          provide: AddressValidationService,
          useValue: mockValidationService,
        },
        {
          provide: 'GeocodingService',
          useValue: mockGeocodingService,
        },
      ],
    }).compile();

    service = module.get<AddressService>(AddressService);
    repository = module.get<Repository<Address>>(getRepositoryToken(Address));
    validationService = module.get<AddressValidationService>(AddressValidationService);
    geocodingService = module.get<MockGeocodingService>('GeocodingService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAddressDto = {
      type: AddressType.SHIPPING,
      firstName: 'John',
      lastName: 'Doe',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      stateProvince: 'CA',
      postalCode: '94105',
      country: CountryCode.US,
      isDefault: true,
    };

    it('should create an address successfully', async () => {
      const userId = 'user-123';
      const mockAddress = { id: 'addr-123', ...createAddressDto, userId };

      mockValidationService.validateAddress.mockResolvedValue({
        isValid: true,
        errors: [],
      });

      mockRepository.create.mockReturnValue(mockAddress);
      mockRepository.save.mockResolvedValue(mockAddress);
      mockRepository.update.mockResolvedValue({});

      const result = await service.create(userId, createAddressDto);

      expect(mockValidationService.validateAddress).toHaveBeenCalledWith(createAddressDto);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createAddressDto,
        userId,
      });
      expect(result).toEqual(mockAddress);
    });

    it('should throw BadRequestException for invalid address', async () => {
      const userId = 'user-123';

      mockValidationService.validateAddress.mockResolvedValue({
        isValid: false,
        errors: ['Invalid postal code'],
      });

      await expect(service.create(userId, createAddressDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('should return an address if found', async () => {
      const userId = 'user-123';
      const addressId = 'addr-123';
      const mockAddress = { id: addressId, userId };

      mockRepository.findOne.mockResolvedValue(mockAddress);

      const result = await service.findOne(userId, addressId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: addressId, userId },
      });
      expect(result).toEqual(mockAddress);
    });

    it('should throw NotFoundException if address not found', async () => {
      const userId = 'user-123';
      const addressId = 'addr-123';

      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(userId, addressId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});