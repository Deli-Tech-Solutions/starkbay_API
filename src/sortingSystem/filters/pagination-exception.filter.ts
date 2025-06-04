import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    BadRequestException,
  } from '@nestjs/common';
  import { Response } from 'express';
  
  @Catch(BadRequestException)
  export class PaginationExceptionFilter implements ExceptionFilter {
    catch(exception: BadRequestException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<Response>();
      const status = exception.getStatus();
  
      const errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        message: exception.message,
        error: 'Bad Request',
      };
  
      response.status(status).json(errorResponse);
    }
  }