/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaxTransaction } from '../entities/tax-transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TaxReportService {
  constructor(
    @InjectRepository(TaxTransaction) private repo: Repository<TaxTransaction>,
  ) {}

  async getSummary(start: Date, end: Date) {
    return this.repo
      .createQueryBuilder('tx')
      .select('tx.jurisdictionId', 'jurisdiction')
      .addSelect('SUM(tx.taxAmount)', 'totalTax')
      .addSelect('SUM(tx.taxableAmount)', 'taxableTotal')
      .where('tx.date BETWEEN :start AND :end', { start, end })
      .groupBy('tx.jurisdictionId')
      .getRawMany();
  }
}
