import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { VendorService } from './vendor.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private vendorService: VendorService,
  ) {}

  async create(vendorId: string, createProductDto: CreateProductDto): Promise<Product> {
    // Verify vendor exists and is active
    const vendor = await this.vendorService.findOne(vendorId);
    
    if (!vendor.isActive) {
      throw new ForbiddenException('Vendor account is not active');
    }

    const product = this.productRepository.create({
      ...createProductDto,
      vendorId,
    });

    return this.productRepository.save(product);
  }

  async findAllByVendor(vendorId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { vendorId },
      relations: ['vendor'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['vendor'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: Partial<CreateProductDto>): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}

// Controllers
// vendor.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { VendorService } from './vendor.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VerifyVendorDto } from './dto/verify-vendor.dto';
import { VendorStatus, CommissionType } from './entities/vendor.entity';

@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post()
  create(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.create(createVendorDto);
  }

  @Get()
  findAll(@Query('status') status?: VendorStatus) {
    return this.vendorService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorService.update(id, updateVendorDto);
  }

  @Patch(':id/verify')
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() verifyDto: VerifyVendorDto,
    @Request() req: any, // In real app, extract user from JWT
  ) {
    const verifiedBy = req.user?.id || 'admin'; // Get from authenticated user
    return this.vendorService.verify(id, verifyDto, verifiedBy);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: VendorStatus,
  ) {
    return this.vendorService.updateStatus(id, status);
  }

  @Patch(':id/commission')
  updateCommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() commissionData: {
      type: CommissionType;
      rate: number;
      minimumAmount?: number;
      maximumAmount?: number;
    },
  ) {
    return this.vendorService.updateCommission(
      id,
      commissionData.type,
      commissionData.rate,
      commissionData.minimumAmount,
      commissionData.maximumAmount,
    );
  }

  @Get(':id/performance')
  getPerformanceReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorService.getPerformanceReport(id);
  }

  @Post(':id/calculate-commission')
  calculateCommission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('orderAmount') orderAmount: number,
  ) {
    return this.vendorService.calculateCommission(id, orderAmount);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendorService.remove(id);
  }
}

// product.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('vendors/:vendorId/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create(vendorId, createProductDto);
  }

  @Get()
  findAllByVendor(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    return this.productService.findAllByVendor(vendorId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: Partial<CreateProductDto>,
  ) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productService.remove(id);
  }
}
