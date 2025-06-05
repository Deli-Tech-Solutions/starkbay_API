
import {
  Injectable,
  InternalServerErrorException,
  StreamableFile,
} from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync, createReadStream } from 'fs';
import { join } from 'path';
import { StorageService } from './storage.service';

@Injectable()
export class LocalStorageService implements StorageService {
  private uploadPath = join(process.cwd(), 'uploads');

  constructor() {
    // Ensure `uploads/` folder exists
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string> {
    const filePath = join(this.uploadPath, key);
    return new Promise((resolve, reject) => {
      const writeStream = createWriteStream(filePath);
      writeStream.write(buffer);
      writeStream.end();
      writeStream.on('finish', () => {
        // Return a relative URL: e.g. "/uploads/<key>"
        const url = `/uploads/${key}`;
        resolve(url);
      });
      writeStream.on('error', (err) => {
        reject(new InternalServerErrorException('Failed to write file: ' + err.message));
      });
    });
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = join(this.uploadPath, key);
    return new Promise((resolve, reject) => {
      // If file doesn’t exist, just resolve
      if (!existsSync(filePath)) {
        return resolve();
      }
      try {
        // Synchronously remove the file
        require('fs').unlinkSync(filePath);
        resolve();
      } catch (err) {
        reject(new InternalServerErrorException('Failed to delete file: ' + err.message));
      }
    });
  }

  async getFileStream(key: string): Promise<StreamableFile> {
    const filePath = join(this.uploadPath, key);
    if (!existsSync(filePath)) {
      throw new InternalServerErrorException('File not found');
    }
    const readStream: ReadStream = createReadStream(filePath);
    return new StreamableFile(readStream);
  }
}
