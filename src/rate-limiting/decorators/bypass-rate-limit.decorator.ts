import { SetMetadata } from '@nestjs/common';

export const BYPASS_RATE_LIMIT_KEY = 'bypass_rate_limit';

export const BypassRateLimit = () => SetMetadata(BYPASS_RATE_LIMIT_KEY, true);

export const TrustedOnly = () => SetMetadata('trusted_only', true);
