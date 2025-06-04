import { Injectable } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export interface FormattedValidationError {
  field: string;
  value: any;
  constraints: string[];
  children?: FormattedValidationError[];
}

@Injectable()
export class ValidationErrorFormatterService {
  formatErrors(errors: ValidationError[]): FormattedValidationError[] {
    return errors.map(error => this.formatError(error));
  }

  private formatError(error: ValidationError): FormattedValidationError {
    const formatted: FormattedValidationError = {
      field: error.property,
      value: error.value,
      constraints: Object.values(error.constraints || {})
    };

    if (error.children && error.children.length > 0) {
      formatted.children = error.children.map(child => this.formatError(child));
    }

    return formatted;
  }

  formatErrorsFlat(errors: ValidationError[]): Record<string, string[]> {
    const result: Record<string, string[]> = {};
    this.flattenErrors(errors, result);
    return result;
  }

  private flattenErrors(
    errors: ValidationError[], 
    result: Record<string, string[]>, 
    parentPath = ''
  ): void {
    for (const error of errors) {
      const fieldPath = parentPath ? `${parentPath}.${error.property}` : error.property;
      
      if (error.constraints) {
        result[fieldPath] = Object.values(error.constraints);
      }

      if (error.children && error.children.length > 0) {
        this.flattenErrors(error.children, result, fieldPath);
      }
    }
  }

  createUserFriendlyMessage(errors: ValidationError[]): string {
    const messages = this.extractErrorMessages(errors);
    return messages.join('; ');
  }

  private extractErrorMessages(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.extractErrorMessages(error.children));
      }
    }

    return messages;
  }
}