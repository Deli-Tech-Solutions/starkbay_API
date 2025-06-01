/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tax } from '../entities/tax.entity';
import { ProductCategory } from '../entities/product-category.entity';
import { ExemptionService } from './exemption.service';
import { CalculateTaxDto } from '../dto/calculate-tax.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(Tax) private taxRepo: Repository<Tax>,
    @InjectRepository(ProductCategory)
    private categoryRepo: Repository<ProductCategory>,
    private exemptionService: ExemptionService,
  ) {}

  async calculateTax(
    dto: CalculateTaxDto,
  ): Promise<{ tax: number; rate: number }> {
    const category = await this.categoryRepo.findOne({
      where: {
        id: dto.productCategoryId,
        isActive: true,
      },
    });
    if (!category) throw new NotFoundException('Product category not found');

    const isExempt =
      dto.isExempt ||
      category.isTaxExempt ||
      (await this.exemptionService.isExempt(dto.entityType, dto.entityId));
    if (isExempt) return { tax: 0, rate: 0 };

    const tax = await this.taxRepo.findOne({
      where: {
        isActive: true,
        jurisdiction: { id: dto.jurisdictionId },
        productCategory: { id: dto.productCategoryId },
      },
    });

    if (!tax) return { tax: 0, rate: 0 };

    return {
      tax: dto.price * +tax.rate,
      rate: +tax.rate,
    };
  }
}
