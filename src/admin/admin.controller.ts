import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminRole } from '../auth/enums/roles.enum';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dashboardService: AdminDashboardService,
  ) {}

  // System Configuration Endpoints
  @Get('config/:key')
  @ApiOperation({ summary: 'Get system configuration' })
  @ApiResponse({ status: 200, description: 'Returns system configuration' })
  async getSystemConfig(@Param('key') key: string) {
    return this.adminService.getSystemConfig(key);
  }

  @Put('config/:key')
  @ApiOperation({ summary: 'Update system configuration' })
  @ApiResponse({ status: 200, description: 'System configuration updated' })
  async updateSystemConfig(
    @Param('key') key: string,
    @Body('value') value: any,
    @Request() req,
  ) {
    return this.adminService.updateSystemConfig(key, value, req.user.id);
  }

  // User Management Endpoints
  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'Returns user details' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req,
  ) {
    return this.adminService.updateUser(id, updateData, req.user.id);
  }

  @Post('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  async deactivateUser(@Param('id') id: string, @Request() req) {
    return this.adminService.deactivateUser(id, req.user.id);
  }

  // Admin Logs Endpoints
  @Get('logs')
  @ApiOperation({ summary: 'Get admin logs' })
  @ApiResponse({ status: 200, description: 'Returns admin logs' })
  async getAdminLogs(
    @Query('adminId') adminId?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminService.getAdminLogs({
      adminId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });
  }

  // Dashboard Endpoints
  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getDashboardStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('dashboard/recent-actions')
  @ApiOperation({ summary: 'Get recent admin actions' })
  @ApiResponse({ status: 200, description: 'Returns recent admin actions' })
  async getRecentAdminActions(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentAdminActions(limit);
  }

  @Get('dashboard/user-activity')
  @ApiOperation({ summary: 'Get user activity statistics' })
  @ApiResponse({ status: 200, description: 'Returns user activity statistics' })
  async getUserActivityStats(@Query('days') days?: number) {
    return this.dashboardService.getUserActivityStats(days);
  }

  @Get('dashboard/admin-activity')
  @ApiOperation({ summary: 'Get admin activity statistics' })
  @ApiResponse({ status: 200, description: 'Returns admin activity statistics' })
  async getAdminActivityStats(@Query('days') days?: number) {
    return this.dashboardService.getAdminActivityStats(days);
  }
} 