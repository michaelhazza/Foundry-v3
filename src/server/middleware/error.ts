import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../errors';
import { logger } from '../lib/logger';
import { env } from '../config/env';

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: string;
    fields?: Record<string, string[]>;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string | undefined;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!fields[path]) fields[path] = [];
      fields[path].push(e.message);
    });

    const validationError = new ValidationError('Validation failed', fields);

    res.status(422).json({
      error: {
        code: validationError.code,
        message: validationError.message,
        requestId,
        fields: validationError.fields,
      },
    } as ErrorResponseBody);
    return;
  }

  // Handle operational errors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, requestId }, 'Non-operational error occurred');
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        requestId,
        details: err.details,
        fields: err.fields,
      },
    } as ErrorResponseBody);
    return;
  }

  // Handle unknown errors
  logger.error({ err, requestId }, 'Unhandled error occurred');

  const response: ErrorResponseBody = {
    error: {
      code: 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
      requestId,
    },
  };

  // Include stack trace in development
  if (env.NODE_ENV !== 'production') {
    response.error.details = err.stack;
  }

  res.status(500).json(response);
}
