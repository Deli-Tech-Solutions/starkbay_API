import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(
    errors: Record<string, string[]>,
    message: string = 'Validation failed'
  ) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        errors,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST
    );
  }
}

export class SanitizationException extends HttpException {
  constructor(message: string = 'Data sanitization failed') {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST
    );
  }
}
