import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentProcessingException extends HttpException {
  constructor(message: string, code?: string) {
    super({
      message,
      code: code || 'PAYMENT_PROCESSING_ERROR',
      statusCode: HttpStatus.BAD_REQUEST
    }, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientFundsException extends HttpException {
  constructor() {
    super({
      message: 'Insufficient funds for this transaction',
      code: 'INSUFFICIENT_FUNDS',
      statusCode: HttpStatus.PAYMENT_REQUIRED
    }, HttpStatus.PAYMENT_REQUIRED);
  }
}

export class PaymentMethodNotSupportedException extends HttpException {
  constructor(method: string) {
    super({
      message: `Payment method ${method} is not supported`,
      code: 'PAYMENT_METHOD_NOT_SUPPORTED',
      statusCode: HttpStatus.BAD_REQUEST
    }, HttpStatus.BAD_REQUEST);
  }
}

export class DuplicatePaymentException extends HttpException {
  constructor() {
    super({
      message: 'Duplicate payment detected',
      code: 'DUPLICATE_PAYMENT',
      statusCode: HttpStatus.CONFLICT
    }, HttpStatus.CONFLICT);
  }
}