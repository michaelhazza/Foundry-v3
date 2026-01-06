import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../errors';

type ValidationType = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, type: ValidationType = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[type];
      const validated = schema.parse(dataToValidate);
      req[type] = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fields: Record<string, string[]> = {};
        error.errors.forEach((e) => {
          const path = e.path.join('.');
          if (!fields[path]) fields[path] = [];
          fields[path].push(e.message);
        });
        next(new ValidationError('Validation failed', fields));
      } else {
        next(error);
      }
    }
  };
}
