export interface PaginationOptions {
    page?: number;
    limit?: number;
    cursor?: string;
    sort?: string;
    order?: 'ASC' | 'DESC';
  }
  
  export interface PaginationMetadata {
    currentPage: number;
    itemCount: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  
  export interface CursorPaginationMetadata {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMetadata;
    links: PaginationLinks;
  }
  
  export interface CursorPaginatedResponse<T> {
    data: T[];
    meta: CursorPaginationMetadata;
    links: CursorPaginationLinks;
  }
  
  export interface PaginationLinks {
    first: string;
    previous?: string;
    next?: string;
    last: string;
  }
  
  export interface CursorPaginationLinks {
    previous?: string;
    next?: string;
  }
  
  export interface SortField {
    field: string;
    order: 'ASC' | 'DESC';
  }
  