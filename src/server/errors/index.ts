// Base Error Class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: string;
  public readonly fields?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    options?: {
      isOperational?: boolean;
      details?: string;
      fields?: Record<string, string[]>;
    }
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options?.isOperational ?? true;
    this.details = options?.details;
    this.fields = options?.fields;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: string) {
    super(message, 400, 'BAD_REQUEST', { details });
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = 'Not authenticated', details?: string) {
    super(message, 401, 'UNAUTHORIZED', { details });
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: string) {
    super(message, 403, 'FORBIDDEN', { details });
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', details?: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND', { details });
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: string) {
    super(message, 409, 'CONFLICT', { details });
  }
}

// 422 Validation Error
export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    fields?: Record<string, string[]>,
    details?: string
  ) {
    super(message, 422, 'VALIDATION_ERROR', { fields, details });
  }
}

// 429 Too Many Requests
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details?: string) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { details });
  }
}

// 500 Internal Server Error
export class InternalError extends AppError {
  constructor(message = 'Internal server error', details?: string) {
    super(message, 500, 'INTERNAL_ERROR', { isOperational: false, details });
  }
}

// 502 Bad Gateway (for external API errors)
export class BadGatewayError extends AppError {
  constructor(message = 'External service error', details?: string) {
    super(message, 502, 'BAD_GATEWAY', { details });
  }
}

// 503 Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', details?: string) {
    super(message, 503, 'SERVICE_UNAVAILABLE', { details });
  }
}
