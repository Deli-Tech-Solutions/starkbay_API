import { diskStorage, memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

export const multerOptions = {
  storage: memoryStorage(), // we process the file in memory (to optimize images before saving)
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: Function) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          `Unsupported file type ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(
            ', ',
          )}`,
        ),
        false,
      );
    }
    cb(null, true);
  },
};
