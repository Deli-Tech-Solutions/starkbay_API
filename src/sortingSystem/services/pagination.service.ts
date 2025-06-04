import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder, Repository } from 'typeorm';
import { 
  PaginationOptions, 
  PaginatedResponse, 
  CursorPaginatedResponse,
  PaginationMetadata,
  CursorPaginationMetadata,
  PaginationLinks,
  CursorPaginationLinks,
  SortField
} from '../interfaces/pagination.interface';

@Injectable()
export class PaginationService {
  /**
   * Create offset-based pagination
   */
  async paginate<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
    baseUrl: string,
  ): Promise<PaginatedResponse<T>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    // Apply sorting
    if (options.sort) {
      this.applySorting(queryBuilder, options.sort);
    }

    // Get total count
    const totalItems = await queryBuilder.getCount();
    
    // Apply pagination
    queryBuilder.skip(offset).take(limit);
    
    // Get items
    const items = await queryBuilder.getMany();

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const meta: PaginationMetadata = {
      currentPage: page,
      itemCount: items.length,
      itemsPerPage: limit,
      totalItems,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };

    const links: PaginationLinks = this.generatePaginationLinks(
      baseUrl,
      page,
      totalPages,
      limit,
      options.sort,
    );

    return {
      data: items,
      meta,
      links,
    };
  }

  /**
   * Create cursor-based pagination
   */
  async paginateWithCursor<T>(
    queryBuilder: SelectQueryBuilder<T>,
    options: PaginationOptions,
    baseUrl: string,
    cursorField: string = 'id',
  ): Promise<CursorPaginatedResponse<T>> {
    const limit = options.limit || 10;
    
    // Apply sorting
    if (options.sort) {
      this.applySorting(queryBuilder, options.sort);
    } else {
      queryBuilder.orderBy(`${queryBuilder.alias}.${cursorField}`, 'ASC');
    }

    // Apply cursor condition
    if (options.cursor) {
      const decodedCursor = this.decodeCursor(options.cursor);
      queryBuilder.andWhere(
        `${queryBuilder.alias}.${cursorField} > :cursor`,
        { cursor: decodedCursor[cursorField] }
      );
    }

    // Fetch one extra item to check if there's a next page
    queryBuilder.take(limit + 1);
    
    const items = await queryBuilder.getMany();
    const hasNextPage = items.length > limit;
    
    // Remove the extra item if it exists
    if (hasNextPage) {
      items.pop();
    }

    const hasPreviousPage = !!options.cursor;
    const startCursor = items.length > 0 ? this.encodeCursor({ [cursorField]: items[0][cursorField] }) : undefined;
    const endCursor = items.length > 0 ? this.encodeCursor({ [cursorField]: items[items.length - 1][cursorField] }) : undefined;

    const meta: CursorPaginationMetadata = {
      hasNextPage,
      hasPreviousPage,
      startCursor,
      endCursor,
    };

    const links: CursorPaginationLinks = this.generateCursorPaginationLinks(
      baseUrl,
      startCursor,
      endCursor,
      hasNextPage,
      hasPreviousPage,
      limit,
      options.sort,
    );

    return {
      data: items,
      meta,
      links,
    };
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting<T>(queryBuilder: SelectQueryBuilder<T>, sortString: string): void {
    const sortFields = this.parseSortString(sortString);
    
    sortFields.forEach((sortField, index) => {
      const fieldName = `${queryBuilder.alias}.${sortField.field}`;
      if (index === 0) {
        queryBuilder.orderBy(fieldName, sortField.order);
      } else {
        queryBuilder.addOrderBy(fieldName, sortField.order);
      }
    });
  }

  /**
   * Parse sort string into sort fields
   */
  private parseSortString(sortString: string): SortField[] {
    return sortString.split(',').map(sort => {
      const [field, order = 'ASC'] = sort.trim().split(':');
      return {
        field: field.trim(),
        order: (order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC',
      };
    });
  }

  /**
   * Generate pagination links
   */
  private generatePaginationLinks(
    baseUrl: string,
    currentPage: number,
    totalPages: number,
    limit: number,
    sort?: string,
  ): PaginationLinks {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());
    if (sort) queryParams.set('sort', sort);

    const first = `${baseUrl}?${queryParams.toString()}&page=1`;
    const last = `${baseUrl}?${queryParams.toString()}&page=${totalPages}`;
    
    let previous: string | undefined;
    let next: string | undefined;

    if (currentPage > 1) {
      previous = `${baseUrl}?${queryParams.toString()}&page=${currentPage - 1}`;
    }

    if (currentPage < totalPages) {
      next = `${baseUrl}?${queryParams.toString()}&page=${currentPage + 1}`;
    }

    return { first, previous, next, last };
  }

  /**
   * Generate cursor pagination links
   */
  private generateCursorPaginationLinks(
    baseUrl: string,
    startCursor?: string,
    endCursor?: string,
    hasNextPage: boolean = false,
    hasPreviousPage: boolean = false,
    limit: number = 10,
    sort?: string,
  ): CursorPaginationLinks {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', limit.toString());
    if (sort) queryParams.set('sort', sort);

    let previous: string | undefined;
    let next: string | undefined;

    if (hasPreviousPage && startCursor) {
      queryParams.set('cursor', startCursor);
      previous = `${baseUrl}?${queryParams.toString()}`;
    }

    if (hasNextPage && endCursor) {
      queryParams.set('cursor', endCursor);
      next = `${baseUrl}?${queryParams.toString()}`;
    }

    return { previous, next };
  }

  /**
   * Encode cursor
   */
  private encodeCursor(cursor: Record<string, any>): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }

  /**
   * Decode cursor
   */
  private decodeCursor(cursor: string): Record<string, any> {
    try {
      return JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  /**
   * Paginate repository results
   */
  async paginateRepository<T>(
    repository: Repository<T>,
    options: PaginationOptions,
    baseUrl: string,
    relations: string[] = [],
    searchFields: string[] = [],
  ): Promise<PaginatedResponse<T>> {
    const queryBuilder = repository.createQueryBuilder('entity');

    // Add relations
    relations.forEach(relation => {
      queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
    });

    // Add search functionality
    if (options.search && searchFields.length > 0) {
      const searchConditions = searchFields.map((field, index) => 
        `entity.${field} ILIKE :search${index}`
      );
      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, 
        searchFields.reduce((params, field, index) => {
          params[`search${index}`] = `%${options.search}%`;
          return params;
        }, {})
      );
    }

    return this.paginate(queryBuilder, options, baseUrl);
  }

  /**
   * Paginate repository results with cursor
   */
  async paginateRepositoryWithCursor<T>(
    repository: Repository<T>,
    options: PaginationOptions,
    baseUrl: string,
    cursorField: string = 'id',
    relations: string[] = [],
    searchFields: string[] = [],
  ): Promise<CursorPaginatedResponse<T>> {
    const queryBuilder = repository.createQueryBuilder('entity');

    // Add relations
    relations.forEach(relation => {
      queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
    });

    // Add search functionality
    if (options.search && searchFields.length > 0) {
      const searchConditions = searchFields.map((field, index) => 
        `entity.${field} ILIKE :search${index}`
      );
      queryBuilder.andWhere(`(${searchConditions.join(' OR ')})`, 
        searchFields.reduce((params, field, index) => {
          params[`search${index}`] = `%${options.search}%`;
          return params;
        }, {})
      );
    }

    return this.paginateWithCursor(queryBuilder, options, baseUrl, cursorField);
  }
}
