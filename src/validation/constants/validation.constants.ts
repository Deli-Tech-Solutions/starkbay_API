export const VALIDATION_CACHE_TTL = 300; // 5 minutes
export const MAX_STRING_LENGTH = 10000;
export const MAX_ARRAY_SIZE = 1000;
export const SANITIZATION_OPTIONS = {
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
  ALLOW_DATA_ATTR: false
};
