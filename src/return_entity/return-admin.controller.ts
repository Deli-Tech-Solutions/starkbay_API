import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ReturnService } from '../services/return.service';
import { RefundService } from '../services/refund.service';
import { ReturnShippingService } from '../services/return-shipping.service';
import { ReturnAnalyticsService } from '../services/return-analytics.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';
import { ReturnStatus } from '../enums/return-status.enum';
import { ProcessRefundDto } from '../dto/process-refund.dto';

@Controller('admin/returns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
export class ReturnAdminController {
  constructor(
    private returnService: ReturnService,
    private refundService: RefundService,
    private returnShippingService: ReturnShippingService,
    private returnAnalyticsService: ReturnAnalyticsService,
  ) {}

  @Get()
  async findAll() {
    return this.returnService.findAllReturns();
  }

  @Put(':id/status/:status')
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: ReturnStatus,
  ) {
    return this.returnService.updateReturnStatus(id, status);
  }

  @Put(':id/refund')
  async processRefund(
    @Param('id') id: string,
    @Body() processRefundDto: ProcessRefundDto,
  ) {
    return this.refundService.processRefund(id, processRefundDto);
  }

  @Put(':id/generate-label')
  async generateLabel(@Param('id') id: string) {
    return this.returnShippingService.generateReturnLabel(id);
  }

  @Put(':id/mark-received')
  async markAsReceived(@Param('id') id: string) {
    return this.returnShippingService.markAsReceived(id);
  }

  @Get('analytics/:period')
  async getAnalytics(@Param('period') period: '7d' | '30d' | '90d' | '1y') {
    return this.returnAnalyticsService.getReturnStats(period);
  }
}