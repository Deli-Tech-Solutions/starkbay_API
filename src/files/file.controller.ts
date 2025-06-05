import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Req,
  Get,
  Param,
  Res,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileService } from './file.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from './multer.config';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileAccessGuard } from './guards/file-access.guard';
import { Response } from 'express';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * POST /files/upload
   * - Headers: Authorization: Bearer <token>
   * - Body: multipart/form-data with `file` (binary) and optional fields (relatedType, relatedId)
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async upload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    if (!file) {
      return { error: 'No file provided' };
    }

    const userId = req.user.id;
    const savedMeta = await this.fileService.uploadFile(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      dto,
    );

    return {
      id: savedMeta.id,
      originalName: savedMeta.originalName,
      mimeType: savedMeta.mimeType,
      size: savedMeta.size,
      url: savedMeta.url,
      uploadDate: savedMeta.uploadDate,
      relatedType: savedMeta.relatedType,
      relatedId: savedMeta.relatedId,
    };
  }

  /**
   * GET /files/:fileId
   * - Streams the requested file back to the client.
   * - Guard ensures only the owner can access.
   */
  @Get(':fileId')
  @UseGuards(FileAccessGuard)
  async download(@Req() req: any, @Res() res: Response) {
    const fileMeta = req.fileMeta;
    const streamable = await this.fileService.getFileStream(fileMeta);

    res.set({
      'Content-Type': fileMeta.mimeType,
      'Content-Disposition': `attachment; filename="${fileMeta.originalName}"`,
    });
    return streamable.getStream().pipe(res);
  }

  /**
   * DELETE /files/:fileId
   * - Deletes the file (both from storage and DB).
   * - Guard ensures only the owner can delete.
   */
  @Delete(':fileId')
  @UseGuards(FileAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any) {
    const fileMeta = req.fileMeta;
    await this.fileService.deleteFile(fileMeta);
    // No JSON body needed for 204
  }

  /**
   * GET /files
   * - Returns a list of FileMetadata belonging to the authenticated user.
   */
  @Get()
  async listUserFiles(@Req() req: any) {
    const userId = req.user.id;
    const files = await this.fileService.listUserFiles(userId);
    return files.map((f) => ({
      id: f.id,
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
      url: f.url,
      uploadDate: f.uploadDate,
      relatedType: f.relatedType,
      relatedId: f.relatedId,
    }));
  }
}
