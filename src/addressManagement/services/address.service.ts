import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address, AddressType } from '../entities/address.entity';
import { CreateAddressDto } from '../dto/create-address.dto';
import { UpdateAddressDto } from '../dto/update-address.dto';
import { AddressQueryDto } from '../dto/address-query.dto';
import { AddressValidationService } from './address-validation.service';
import { GeocodingService } from '../interfaces/geocoding.interface';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly validationService: AddressValidationService,
    private readonly geocodingService: GeocodingService,
  ) {}

  async create(userId: string, createAddressDto: CreateAddressDto): Promise<Address> {
    // Validate address data
    const validation = await this.validationService.validateAddress(createAddressDto);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Address validation failed',
        errors: validation.errors,
        suggestions: validation.suggestions
      });
    }

    // Handle default address logic
    if (createAddressDto.isDefault) {
      await this.unsetDefaultAddresses(userId, createAddressDto.type);
    }

    // Create address entity
    const address = this.addressRepository.create({
      ...createAddressDto,
      userId,
    });

    // Geocode address
    try {
      const fullAddress = `${createAddressDto.addressLine1}, ${createAddressDto.city}, ${createAddressDto.stateProvince}, ${createAddressDto.postalCode}, ${createAddressDto.country}`;
      const geocodingResult = await this.geocodingService.geocodeAddress(fullAddress);
      
      if (geocodingResult) {
        address.latitude = geocodingResult.latitude;
        address.longitude = geocodingResult.longitude;
        address.formattedAddress = geocodingResult.formattedAddress;
      }
    } catch (error) {
      // Continue without geocoding if it fails
      console.warn('Geocoding failed, continuing without coordinates:', error);
    }

    return this.addressRepository.save(address);
  }

  async findAll(userId: string, query: AddressQueryDto): Promise<Address[]> {
    const queryBuilder = this.addressRepository
      .createQueryBuilder('address')
      .where('address.userId = :userId', { userId });

    if (query.type) {
      queryBuilder.andWhere('address.type = :type', { type: query.type });
    }

    if (query.isDefault !== undefined) {
      queryBuilder.andWhere('address.isDefault = :isDefault', { isDefault: query.isDefault });
    }

    if (query.search) {
      queryBuilder.andWhere(
        '(address.firstName ILIKE :search OR address.lastName ILIKE :search OR address.city ILIKE :search OR address.nickname ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    return queryBuilder
      .orderBy('address.isDefault', 'DESC')
      .addOrderBy('address.createdAt', 'DESC')
      .getMany();
  }

  async findOne(userId: string, id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({
      where: { id, userId }
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async update(userId: string, id: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(userId, id);

    // Validate updated address data
    const updatedData = { ...address, ...updateAddressDto };
    const validation = await this.validationService.validateAddress(updatedData);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Address validation failed',
        errors: validation.errors,
        suggestions: validation.suggestions
      });
    }

    // Handle default address logic
    if (updateAddressDto.isDefault && !address.isDefault) {
      await this.unsetDefaultAddresses(userId, updateAddressDto.type || address.type);
    }

    // Update geocoding if address changed
    const addressFieldsChanged = [
      'addressLine1', 'addressLine2', 'city', 'stateProvince', 'postalCode', 'country'
    ].some(field => updateAddressDto[field] && updateAddressDto[field] !== address[field]);

    if (addressFieldsChanged) {
      try {
        const fullAddress = `${updateAddressDto.addressLine1 || address.addressLine1}, ${updateAddressDto.city || address.city}, ${updateAddressDto.stateProvince || address.stateProvince}, ${updateAddressDto.postalCode || address.postalCode}, ${updateAddressDto.country || address.country}`;
        const geocodingResult = await this.geocodingService.geocodeAddress(fullAddress);
        
        if (geocodingResult) {
          updateAddressDto.latitude = geocodingResult.latitude;
          updateAddressDto.longitude = geocodingResult.longitude;
          updateAddressDto.formattedAddress = geocodingResult.formattedAddress;
        }
      } catch (error) {
        console.warn('Geocoding failed during update:', error);
      }
    }

    Object.assign(address, updateAddressDto);
    return this.addressRepository.save(address);
  }

  async remove(userId: string, id: string): Promise<void> {
    const address = await this.findOne(userId, id);
    await this.addressRepository.remove(address);
  }

  async setDefault(userId: string, id: string, type: AddressType): Promise<Address> {
    const address = await this.findOne(userId, id);
    
    // Unset other default addresses of the same type
    await this.unsetDefaultAddresses(userId, type);
    
    // Set this address as default
    address.isDefault = true;
    address.type = type;
    
    return this.addressRepository.save(address);
  }

  async getDefault(userId: string, type: AddressType): Promise<Address | null> {
    return this.addressRepository.findOne({
      where: { userId, type, isDefault: true }
    });
  }

  async getAddressBook(userId: string): Promise<{
    billing: Address[];
    shipping: Address[];
    defaultBilling: Address | null;
    defaultShipping: Address | null;
  }> {
    const [billing, shipping, defaultBilling, defaultShipping] = await Promise.all([
      this.findAll(userId, { type: AddressType.BILLING }),
      this.findAll(userId, { type: AddressType.SHIPPING }),
      this.getDefault(userId, AddressType.BILLING),
      this.getDefault(userId, AddressType.SHIPPING)
    ]);

    return {
      billing,
      shipping,
      defaultBilling,
      defaultShipping
    };
  }

  private async unsetDefaultAddresses(userId: string, type: AddressType): Promise<void> {
    await this.addressRepository.update(
      { userId, type, isDefault: true },
      { isDefault: false }
    );
  }

  async bulkImport(userId: string, addresses: CreateAddressDto[]): Promise<Address[]> {
    const validatedAddresses: Address[] = [];
    const errors: string[] = [];

    for (const [index, addressDto] of addresses.entries()) {
      try {
        const validation = await this.validationService.validateAddress(addressDto);
        if (!validation.isValid) {
          errors.push(`Address ${index + 1}: ${validation.errors.join(', ')}`);
          continue;
        }

        const address = this.addressRepository.create({
          ...addressDto,
          userId,
        });

        validatedAddresses.push(address);
      } catch (error) {
        errors.push(`Address ${index + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Bulk import validation failed',
        errors
      });
    }

    return this.addressRepository.save(validatedAddresses);
  }
}