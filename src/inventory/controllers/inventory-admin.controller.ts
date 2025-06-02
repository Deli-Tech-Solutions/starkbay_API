import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { InventoryReservationService } from '../services/inventory-reservation.service';
import { InventoryReportService } from '../services/inventory-report.service';
import { AdjustInventoryDto } from '../dto/adjust-inventory.dto';
import { ReserveInventoryDto } from '../dto/reserve-inventory.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
export class InventoryAdminController {
  constructor(
    private inventoryService: InventoryService,
    private reservationService: InventoryReservationService,
    private reportService: InventoryReportService,
  ) {}

  @Post(':productId/adjust')
  async adjustInventory(
    @Param('productId') productId: string,
    @Body() adjustInventoryDto: AdjustInventoryDto,
  ) {
    return this.inventoryService.adjustInventory(productId, adjustInventoryDto);
  }

  @Post(':productId/reserve')
  async reserveInventory(
    @Param('productId') productId: string,
    @Body() reserveInventoryDto: ReserveInventoryDto,
  ) {
    return this.reservationService.reserveInventory(productId, reserveInventoryDto);
  }

  @Put('reservations/:id/release')
  async releaseReservation(@Param('id') id: string) {
    return this.reservationService.releaseReservation(id);
  }

  @Put('reservations/:id/commit')
  async commitReservation(@Param('id') id: string) {
    return this.reservationService.commitReservation(id);
  }

  @Get('reports/status')
  async getStatusReport() {
    return this.reportService.getInventoryStatusReport();
  }

  @Get('reports/movement')
  async getMovementReport() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    return this.reportService.getInventoryMovementReport(startDate, endDate);
  }

  @Put(':productId/reorder-points')
  async updateReorderPoints(
    @Param('productId') productId: string,
    @Body() body: { reorderPoint: number; reorderQuantity: number },
  ) {
    return this.inventoryService.updateReorderPoints(
      productId,
      body.reorderPoint,
      body.reorderQuantity,
    );
  }

  @Get(':productId/calculate-reorder')
  async calculateReorderPoints(@Param('productId') productId: string) {
    return this.reportService.getStockTurnoverReport();
  }
}