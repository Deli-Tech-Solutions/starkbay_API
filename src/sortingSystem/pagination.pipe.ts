import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { PaginationOptions } from '../interfaces/pagination.interface';

@Injectable()
export class PaginationPipe implements PipeTransform {
  transform(value: PaginationOptions): PaginationOptions {
    if (value.page && value.page < 1) {
      throw new BadRequestException('Page must be greater than 0');
    }

    if (value.limit && (value.limit < 1 || value.limit > 100)) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    if (value.sort) {
      this.validateSortString(value.sort);
    }

    return value;
  }

  private validateSortString(sortString: string): void {
    const sortFields = sortString.split(',');
    
    for (const sortField of sortFields) {
      const [field, order] = sortField.trim().split(':');
      
      if (!field) {
        throw new BadRequestException('Sort field cannot be empty');
      }

      if (order && !['ASC', 'DESC'].includes(order.toUpperCase())) {
        throw new BadRequestException('Sort order must be ASC or DESC');
      }
    }
  }
}