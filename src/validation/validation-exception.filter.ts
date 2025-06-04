import { 
  ExceptionFilter, 
  Catch, 
  ArgumentsHost, 
  BadRequestException 
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationException } from '../exceptions/validation.exception';

@Catch(BadRequestException, ValidationException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException | ValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
    };

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      errorResponse = {
        ...errorResponse,
        ...exceptionResponse,
      };
    } else {
      errorResponse.message = exceptionResponse;
    }

    // Ensure consistent error structure
    if (!errorResponse.errors && Array.isArray(errorResponse.message)) {
      errorResponse.errors = this.formatValidationErrors(errorResponse.message);
      errorResponse.message = 'Validation failed';
    }

    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(messages: string[]): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    
    messages.forEach((message, index) => {
      errors[`field_${index}`] = [message];
    });

    return errors;
  }
}
