import { StreamableFile } from '@nestjs/common';
import { ReadStream } from 'fs';

export abstract class StorageService {
 
  abstract saveFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string>;

  
  abstract deleteFile(key: string): Promise<void>;

  abstract getFileStream(key: string): Promise<StreamableFile>;
}