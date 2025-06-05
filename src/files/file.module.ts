import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FileMetadata } from './entities/file-metadata.entity';
import { User } from '../users/user.entity'; // adjust path if needed
import { FileAccessGuard } from './guards/file-access.guard';
import { StorageService } from './storage/storage.service';
import { LocalStorageService } from './storage/local-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileMetadata, User])],
  controllers: [FileController],
  providers: [
    FileService,
    FileAccessGuard,
    {
      provide: StorageService,
      useClass: LocalStorageService,
    },
  ],
  exports: [FileService],
})
export class FileModule {}
