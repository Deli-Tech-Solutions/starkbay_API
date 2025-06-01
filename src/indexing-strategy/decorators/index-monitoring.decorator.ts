import { SetMetadata } from '@nestjs/common';

export const MONITOR_INDEX_KEY = 'monitor_index';

export interface IndexMonitoringOptions {
  enabled?: boolean;
  tableName?: string;
  threshold?: number;
}

/**
 * Decorator to enable automatic index monitoring for entity methods
 */
export const MonitorIndex = (options: IndexMonitoringOptions = {}) => 
  SetMetadata(MONITOR_INDEX_KEY, {
    enabled: true,
    threshold: 100,
    ...options
  });