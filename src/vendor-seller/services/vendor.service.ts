import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorStatus } from './entities/vendor.entity';
import { VendorCommission, CommissionType } from './entities/vendor-commission.entity';
import { VendorPerformance } from './entities/vendor-performance.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VerifyVendorDto } from './dto/verify-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(VendorCommission)
    private commissionRepository: Repository<VendorCommission>,
    @InjectRepository(VendorPerformance)
    private performanceRepository: Repository<VendorPerformance>,
  ) {}

  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    // Check if vendor with email already exists
    const existingVendor = await this.vendorRepository.findOne({
      where: { email: createVendorDto.email }
    });

    if (existingVendor) {
      throw new ConflictException('Vendor with this email already exists');
    }

    const vendor = this.vendorRepository.create(createVendorDto);
    const savedVendor = await this.vendorRepository.save(vendor);

    // Create default commission structure (5% percentage)
    const commission = this.commissionRepository.create({
      vendorId: savedVendor.id,
      type: CommissionType.PERCENTAGE,
      rate: 5.00,
      minimumAmount: 0,
    });
    await this.commissionRepository.save(commission);

    // Create performance tracking record
    const performance = this.performanceRepository.create({
      vendorId: savedVendor.id,
    });
    await this.performanceRepository.save(performance);

    return this.findOne(savedVendor.id);
  }

  async findAll(status?: VendorStatus): Promise<Vendor[]> {
    const queryBuilder = this.vendorRepository
      .createQueryBuilder('vendor')
      .leftJoinAndSelect('vendor.commission', 'commission')
      .leftJoinAndSelect('vendor.performance', 'performance');

    if (status) {
      queryBuilder.where('vendor.status = :status', { status });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: ['commission', 'performance', 'products'],
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }

  async update(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);
    
    if (updateVendorDto.email && updateVendorDto.email !== vendor.email) {
      const existingVendor = await this.vendorRepository.findOne({
        where: { email: updateVendorDto.email }
      });
      
      if (existingVendor) {
        throw new ConflictException('Vendor with this email already exists');
      }
    }

    Object.assign(vendor, updateVendorDto);
    return this.vendorRepository.save(vendor);
  }

  async verify(id: string, verifyDto: VerifyVendorDto, verifiedBy: string): Promise<Vendor> {
    const vendor = await this.findOne(id);

    if (vendor.status === VendorStatus.VERIFIED) {
      throw new BadRequestException('Vendor is already verified');
    }

    vendor.status = verifyDto.status;
    
    if (verifyDto.status === VendorStatus.VERIFIED) {
      vendor.verifiedAt = new Date();
      vendor.verifiedBy = verifiedBy;
      vendor.rejectionReason = null;
    } else if (verifyDto.status === VendorStatus.REJECTED) {
      vendor.rejectionReason = verifyDto.rejectionReason;
      vendor.verifiedAt = null;
      vendor.verifiedBy = null;
    }

    return this.vendorRepository.save(vendor);
  }

  async updateStatus(id: string, status: VendorStatus): Promise<Vendor> {
    const vendor = await this.findOne(id);
    vendor.status = status;
    return this.vendorRepository.save(vendor);
  }

  async updateCommission(
    vendorId: string,
    type: CommissionType,
    rate: number,
    minimumAmount: number = 0,
    maximumAmount?: number
  ): Promise<VendorCommission> {
    let commission = await this.commissionRepository.findOne({
      where: { vendorId }
    });

    if (!commission) {
      commission = this.commissionRepository.create({ vendorId });
    }

    commission.type = type;
    commission.rate = rate;
    commission.minimumAmount = minimumAmount;
    commission.maximumAmount = maximumAmount;

    return this.commissionRepository.save(commission);
  }

  async calculateCommission(vendorId: string, orderAmount: number): Promise<number> {
    const commission = await this.commissionRepository.findOne({
      where: { vendorId, isActive: true }
    });

    if (!commission) {
      throw new NotFoundException('Commission structure not found for vendor');
    }

    let commissionAmount = 0;

    if (commission.type === CommissionType.PERCENTAGE) {
      commissionAmount = (orderAmount * commission.rate) / 100;
    } else {
      commissionAmount = commission.rate;
    }

    // Apply minimum and maximum limits
    if (commissionAmount < commission.minimumAmount) {
      commissionAmount = commission.minimumAmount;
    }

    if (commission.maximumAmount && commissionAmount > commission.maximumAmount) {
      commissionAmount = commission.maximumAmount;
    }

    return Math.round(commissionAmount * 100) / 100; // Round to 2 decimal places
  }

  async updatePerformanceMetrics(
    vendorId: string,
    metrics: {
      totalOrders?: number;
      totalRevenue?: number;
      totalCommission?: number;
      averageRating?: number;
      totalReviews?: number;
      cancelledOrders?: number;
      returnedOrders?: number;
    }
  ): Promise<VendorPerformance> {
    let performance = await this.performanceRepository.findOne({
      where: { vendorId }
    });

    if (!performance) {
      performance = this.performanceRepository.create({ vendorId });
    }

    Object.assign(performance, metrics);

    // Calculate rates
    if (performance.totalOrders > 0) {
      performance.fulfillmentRate = 
        ((performance.totalOrders - performance.cancelledOrders) / performance.totalOrders) * 100;
    }

    return this.performanceRepository.save(performance);
  }

  async getPerformanceReport(vendorId: string): Promise<VendorPerformance> {
    const performance = await this.performanceRepository.findOne({
      where: { vendorId },
      relations: ['vendor']
    });

    if (!performance) {
      throw new NotFoundException('Performance data not found for vendor');
    }

    return performance;
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findOne(id);
    await this.vendorRepository.remove(vendor);
  }
}
