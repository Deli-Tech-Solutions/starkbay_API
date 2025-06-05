import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FileMetadata } from '../entities/file-metadata.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FileAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(FileMetadata)
    private readonly fileRepo: Repository<FileMetadata>,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const fileId = request.params.fileId;

    if (!user || !fileId) {
      throw new ForbiddenException('Missing user credentials or fileId');
    }

    const fileMeta = await this.fileRepo.findOne({
      where: { id: fileId },
      relations: ['owner'],
    });

    if (!fileMeta) {
      throw new ForbiddenException('File not found');
    }

    // Only the owner can access. (You can extend this to handle shared permissions.)
    if (fileMeta.owner.id !== user.id) {
      throw new ForbiddenException('You do not have permission to access this file');
    }

    // Attach the metadata to the request so controllers can reuse it
    request.fileMeta = fileMeta;
    return true;
  }
}
