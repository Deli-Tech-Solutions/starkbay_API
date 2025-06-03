import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { InjectLogger } from 'nest-winston';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(@InjectLogger() private readonly logger: Logger) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;

    res.on('finish', () => {
      this.logger.info('HTTP Request', {
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        responseTime: `${res.getHeader('X-Response-Time') || 'N/A'} ms`,
      });
    });

    next();
  }
}
