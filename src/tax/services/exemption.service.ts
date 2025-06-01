/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxExemption } from '../entities/tax-exemption.entity';

@Injectable()
export class ExemptionService {
  constructor(
    @InjectRepository(TaxExemption) private repo: Repository<TaxExemption>,
  ) {}

  async isExempt(entityType?: string, entityId?: string): Promise<boolean> {
    if (!entityType || !entityId) return false;
    return !!(await this.repo.findOneBy({ entityType, entityId }));
  }
}
