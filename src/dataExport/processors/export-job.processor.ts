import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { DataExportService } from '../services/data-export.service';

@Processor('export-queue')
export class ExportJobProcessor {
  constructor(private dataExportService: DataExportService) {}

  @Process('processExport')
  async handleExport(job: Job) {
    const { exportLogId, exportDto } = job.data;
    await this.dataExportService.processExport(exportLogId, exportDto);
  }
}

// dataExport/controllers/data-export.controller.ts
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Res, 
  Request,
  UseGuards,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { DataExportService } from '../services/data-export.service';
import { ExportDataDto } from '../dto/export-data.dto';
import * as fs from 'fs';

@Controller('data-export')
export class DataExportController {
  constructor(private dataExportService: DataExportService) {}

  @Post('export')
  async exportData(@Request() req, @Body() exportDto: ExportDataDto) {
    const userId = req.user?.id || 'anonymous';
    const exportLog = await this.dataExportService.exportData(userId, exportDto);
    
    return {
      success: true,
      data: {
        exportId: exportLog.id,
        status: exportLog.status,
      },
    };
  }

  @Get('status/:exportId')
  async getExportStatus(@Param('exportId') exportId: string) {
    const exportLog = await this.dataExportService.getExportStatus(exportId);
    
    return {
      success: true,
      data: exportLog,
    };
  }

  @Get('download/:exportId')
  async downloadExport(@Param('exportId') exportId: string, @Res() res: Response) {
    try {
      const filePath = await this.dataExportService.downloadExport(exportId);
      
      if (!fs.existsSync(filePath)) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'File not found',
        });
      }

      const fileName = filePath.split('/').pop();
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  }
}
