import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'SYS:standard',
    },
  } : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash', 'token', 'apiKey'],
    censor: '[REDACTED]',
  },
});
