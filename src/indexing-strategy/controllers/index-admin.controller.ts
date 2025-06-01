import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IndexManagementService } from '../services/index-management.service';
import { IndexMonitoringService } from '../services/index-monitoring.service';
import { IndexSuggestionService } from '../services/index-suggestion.service';
import { IndexMaintenanceService } from '../services/index-maintenance.service';

@ApiTags('Index Administration')
@Controller('admin/indexes')
export class IndexAdminController {
  constructor(
    private indexManagementService: IndexManagementService,
    private indexMonitoringService: IndexMonitoringService,
    private indexSuggestionService: IndexSuggestionService,
    private indexMaintenanceService: IndexMaintenanceService,
  ) {}

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Setup all database indexes' })
  @ApiResponse({ status: 200, description: 'Indexes created successfully' })
  async setupIndexes() {
    await this.indexManagementService.createSingleColumnIndexes();
    await this.indexManagementService.createCompositeIndexes();
    await this.indexManagementService.createPartialIndexes();
    await this.indexManagementService.createExpressionIndexes();
    
    return { 
      message: 'Indexes created successfully',
      timestamp: new Date().toISOString()
    };
  }

  @Get('usage-stats')
  @ApiOperation({ summary: 'Get index usage statistics' })
  @ApiResponse({ status: 200, description: 'Index usage statistics retrieved' })
  async getUsageStats() {
    const stats = await this.indexMonitoringService.getIndexUsageStats();
    return {
      data: stats,
      count: stats.length,
      timestamp: new Date().toISOString()
    };
  }

  @Get('unused')
  @ApiOperation({ summary: 'Get list of unused indexes' })
  @ApiResponse({ status: 200, description: 'Unused indexes retrieved' })
  async getUnusedIndexes() {
    const unusedIndexes = await this.indexMonitoringService.getUnusedIndexes();
    const totalSize = unusedIndexes.reduce((sum, index) => sum + index.sizeBytes, 0);
    
    return {
      data: unusedIndexes,
      count: unusedIndexes.length,
      totalSizeBytes: totalSize,
      timestamp: new Date().toISOString()
    };
  }

  @Get('fragmentation')
  @ApiOperation({ summary: 'Check index fragmentation' })
  @ApiResponse({ status: 200, description: 'Index fragmentation data retrieved' })
  async getFragmentation() {
    const fragmentation = await this.indexMonitoringService.checkIndexFragmentation();
    return {
      data: fragmentation,
      count: fragmentation.length,
      timestamp: new Date().toISOString()
    };
  }

  @Post('suggestions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate index suggestions' })
  @ApiResponse({ status: 200, description: 'Index suggestions generated' })
  async generateSuggestions() {
    await this.indexSuggestionService.generateIndexSuggestions();
    return { 
      message: 'Index suggestions generated and logged',
      timestamp: new Date().toISOString()
    };
  }

  @Post('maintenance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Perform manual maintenance' })
  @ApiResponse({ status: 200, description: 'Maintenance completed' })
  async performMaintenance() {
    await this.indexMaintenanceService.performRoutineMaintenance();
    return { 
      message: 'Index maintenance completed',
      timestamp: new Date().toISOString()
    };
  }

  @Get('bloat')
  @ApiOperation({ summary: 'Check index bloat' })
  @ApiResponse({ status: 200, description: 'Index bloat information retrieved' })
  async getIndexBloat() {
    const bloatInfo = await this.indexMaintenanceService.checkIndexBloat();
    return {
      data: bloatInfo,
      count: bloatInfo.length,
      timestamp: new Date().toISOString()
    };
  }
}