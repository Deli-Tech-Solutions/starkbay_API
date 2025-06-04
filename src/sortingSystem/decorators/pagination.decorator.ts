import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PaginationOptions } from '../interfaces/pagination.interface';

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationOptions => {
    const request = ctx.switchToHttp().getRequest();
    const { page, limit, cursor, sort, search } = request.query;

    return {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      cursor,
      sort,
      search,
    };
  },
);

export const GetBaseUrl = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return `${request.protocol}://${request.get('Host')}${request.route.path}`;
  },
);