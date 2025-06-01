/* eslint-disable prettier/prettier */
import { Body, Controller, Post } from '@nestjs/common';
import { TaxService } from '../services/tax.service';
import { CalculateTaxDto } from '../dto/calculate-tax.dto';

@Controller('tax')
export class TaxController {
  constructor(private readonly taxService: TaxService) {}

  @Post('calculate')
  calculate(@Body() dto: CalculateTaxDto) {
    return this.taxService.calculateTax(dto);
  }
}
