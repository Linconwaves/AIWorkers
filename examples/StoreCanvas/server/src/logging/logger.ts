import pino, { type LoggerOptions } from 'pino';
import { getConfig } from '../config';

const env = getConfig();

export const loggerOptions: LoggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'production'
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:standard' }
        }
};

export const logger = pino(loggerOptions);
