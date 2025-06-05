import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FileMetadata } from './entities/file-metadata.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { StorageService } from './storage/storage.service';
import { User } from '../users/user.entity'; // adjust path if needed
import { Cron, CronExpression } from '@nestjs/schedule';
import * as sharp from 'sharp';
import { randomUUID } from 'crypto';
import { StreamableFile } from '@nestjs/common';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    @InjectRepository(FileMetadata)
    private readonly fileRepo: Repository<FileMetadata>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Uploads a file buffer (from Multer) and returns FileMetadata.
   */
  async uploadFile(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    size: number,
    dto: UploadFileDto,
  ): Promise<FileMetadata> {
    // 1. Check that user exists
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Check for valid MIME types is already done by multer’s fileFilter
    //    (but you could place extra scanning logic here, e.g., virus scan)

    // 3. If image, run through Sharp to resize/optimize
    let finalBuffer = fileBuffer;
    if (mimeType.startsWith('image/')) {
      try {
        const transformer = sharp(fileBuffer).rotate();

        // Resize: max width 1920, preserve aspect ratio, no upscaling
        transformer.resize({ width: 1920, withoutEnlargement: true });

        // If JPEG, compress to quality 80; if PNG, compress accordingly
        if (mimeType === 'image/png') {
          transformer.png({ quality: 80 });
        } else {
          // defaults to JPEG for other image types
          transformer.jpeg({ quality: 80 });
        }

        finalBuffer = await transformer.toBuffer();
      } catch (err) {
        throw new BadRequestException(`Failed to optimize image: ${err.message}`);
      }
    }

    // 4. Generate a unique key (e.g. UUID + extension)
    const extension = originalName.substring(originalName.lastIndexOf('.')) || '';
    const key = `${randomUUID()}${extension}`;

    // 5. Save file via storage service, get back URL
    const url = await this.storageService.saveFile(finalBuffer, key, mimeType);

    // 6. Persist metadata
    const metadata = this.fileRepo.create({
      filename: key,
      originalName,
      mimeType,
      size: finalBuffer.length,
      url,
      owner: user,
      relatedType: dto.relatedType,
      relatedId: dto.relatedId,
    });
    return this.fileRepo.save(metadata);
  }

  /**
   * Returns a StreamableFile for downloading.
   * The FileAccessGuard already verified ownership and attached fileMeta to request.
   */
  async getFileStream(fileMeta: FileMetadata): Promise<StreamableFile> {
    return this.storageService.getFileStream(fileMeta.filename);
  }

  /**
   * Deletes the file from both storage and database.
   * The FileAccessGuard verified ownership.
   */
  async deleteFile(fileMeta: FileMetadata): Promise<void> {
    // 1. Delete from storage
    await this.storageService.deleteFile(fileMeta.filename);

    // 2. Delete metadata
    await this.fileRepo.delete({ id: fileMeta.id });
  }

  /**
   * Lists all files owned by a given user.
   */
  async listUserFiles(userId: string): Promise<FileMetadata[]> {
    return this.fileRepo.find({
      where: { owner: { id: userId } },
      order: { uploadDate: 'DESC' },
    });
  }

  /**
   * Daily cron job (midnight Africa/Lagos) to remove orphaned files:
   * files present on disk/cloud but not referenced in the DB.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Africa/Lagos' })
  async cleanupOrphanedFiles() {
    this.logger.log('Running orphaned file cleanup job…');

    // 1. Fetch all keys from storage folder
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      this.logger.warn(`Uploads directory not found at ${uploadsDir}`);
      return;
    }

    const filesInDir: string[] = readdirSync(uploadsDir);
    if (filesInDir.length === 0) {
      this.logger.log('No files found in uploads directory.');
      return;
    }

    // 2. Fetch all filenames from DB
    const allMeta = await this.fileRepo.find({ select: ['filename'] });
    const filenamesInDb = new Set(allMeta.map((m) => m.filename));

    // 3. Compare and delete any file not in DB
    for (const filename of filesInDir) {
      if (!filenamesInDb.has(filename)) {
        try {
          await this.storageService.deleteFile(filename);
          this.logger.log(`Deleted orphaned file: ${filename}`);
        } catch (err) {
          this.logger.error(`Failed to delete orphaned file ${filename}: ${err.message}`);
        }
      }
    }

    this.logger.log('Orphaned file cleanup job complete.');
  }
}
