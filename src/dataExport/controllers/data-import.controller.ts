import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataImportService } from '../services/data-import.service';
import { ImportDataDto } from '../dto/import-data.dto';

@Controller('data-import')
export class DataImportController {
  constructor(private dataImportService: DataImportService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importData(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() importDto: ImportDataDto
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const userId = req.user?.id || 'anonymous';
    const importLog = await this.dataImportService.importData(userId, file, importDto);
    
    return {
      success: true,
      data: {
        importId: importLog.id,
        status: importLog.status,
      },
    };
  }

  @Get('status/:importId')
  async getImportStatus(@Param('importId') importId: string) {
    const importLog = await this.dataImportService.getImportStatus(importId);
    
    return {
      success: true,
      data: importLog,
    };
  }

  @Get('report/:importId')
  async getImportReport(@Param('importId') importId: string) {
    const report = await this.dataImportService.getImportReport(importId);
    
    return {
      success: true,
      data: report,
    };
  }
}
