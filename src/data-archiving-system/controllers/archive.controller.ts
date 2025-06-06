import { Controller, Get, Post, Delete, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ArchiveService } from '../services/archive.service';
import { ArchiveSchedulerService } from '../services/archive-scheduler.service';

@ApiTags('Archive')
@Controller('archive')
export class ArchiveController {
  constructor(
    private archiveService: ArchiveService,
    private archiveSchedulerService: ArchiveSchedulerService,
  ) {}

  @Post('tables/:tableName/archive')
  @ApiOperation({ summary: 'Manually trigger archive for a specific table' })
  async archiveTable(@Param('tableName') tableName: string) {
    const jobId = await this.archiveSchedulerService.triggerArchiveJob(tableName);
    return { jobId, message: `Archive job started for ${tableName}` };
  }

  @Get('tables/:tableName/data')
  @ApiOperation({ summary: 'Retrieve archived data' })
  async getArchivedData(
    @Param('tableName') tableName: string,
    @Query('limit') limit: number = 100,
    @Query() filters: any,
  ) {
    const data = await this.archiveService.retrieveArchivedData(
      tableName,
      filters,
      Number(limit),
    );
    return { data, count: data.length };
  }

  @Post('records/:archiveId/restore')
  @ApiOperation({ summary: 'Restore a specific archived record' })
  async restoreRecord(@Param('archiveId') archiveId: string) {
    await this.archiveService.restoreArchivedData(archiveId);
    return { message: 'Record restored successfully' };
  }

  @Post('export')
  @ApiOperation({ summary: 'Export archived data' })
  async exportArchive(
    @Body() exportRequest: {
      tableName: string;
      format?: 'json' | 'csv' | 'sql';
      startDate?: string;
      endDate?: string;
    },
  ) {
    const filename = await this.archiveService.exportArchiveData(
      exportRequest.tableName,
      exportRequest.format || 'json',
      exportRequest.startDate ? new Date(exportRequest.startDate) : undefined,
      exportRequest.endDate ? new Date(exportRequest.endDate) : undefined,
    );
    return { filename, message: 'Export completed successfully' };
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get archive statistics' })
  async getStatistics() {
    const stats = await this.archiveService.getArchiveStatistics();
    return { statistics: stats };
  }

  @Delete('purge')
  @ApiOperation({ summary: 'Manually trigger purge of old archives' })
  async purgeOldArchives() {
    await this.archiveService.purgeOldArchives();
    return { message: 'Purge completed successfully' };
  }
}