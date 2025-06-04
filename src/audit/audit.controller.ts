import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Query audit logs' })
  @ApiResponse({ status: 200, description: 'Returns paginated audit logs' })
  async queryLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.queryLogs({
      entityType,
      entityId,
      userId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  @Post('export')
  @ApiOperation({ summary: 'Export audit logs' })
  @ApiResponse({ status: 200, description: 'Returns exported audit logs' })
  async exportLogs(
    @Body('startDate') startDate: string,
    @Body('endDate') endDate: string,
    @Body('format') format: 'csv' | 'json',
  ) {
    return this.auditService.exportLogs({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format,
    });
  }

  @Get('suspicious-activity')
  @ApiOperation({ summary: 'Get suspicious activity report' })
  @ApiResponse({ status: 200, description: 'Returns suspicious activity report' })
  async getSuspiciousActivity(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('threshold') threshold: number,
  ) {
    return this.auditService.getSuspiciousActivity({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      threshold,
    });
  }
} 