export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export interface ValidationOptions {
  groups?: string[];
  skipMissingProperties?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  transform?: boolean;
  sanitize?: boolean;
}

export interface CacheOptions {
  ttl?: number;
  key?: string;
  enabled?: boolean;
}

// validation/enums/validation-groups.enum.ts
export enum ValidationGroups {
  CREATE = 'create',
  UPDATE = 'update',
  PARTIAL_UPDATE = 'partial-update',
  LOGIN = 'login',
  REGISTRATION = 'registration',
  ADMIN = 'admin',
  PUBLIC = 'public'
}
