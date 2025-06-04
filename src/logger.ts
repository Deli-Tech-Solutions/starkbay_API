import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonLoggerOptions: winston.LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
};