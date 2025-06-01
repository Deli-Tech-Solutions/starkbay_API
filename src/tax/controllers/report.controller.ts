/* eslint-disable prettier/prettier */
import { Controller, Get, Query } from '@nestjs/common';
import { TaxReportService } from '../services/tax-report.service';

@Controller('tax-report')
export class ReportController {
  constructor(private readonly reportService: TaxReportService) {}

  @Get()
  getSummary(@Query('start') start: string, @Query('end') end: string) {
    return this.reportService.getSummary(new Date(start), new Date(end));
  }
}
