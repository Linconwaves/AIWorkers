import { z } from 'zod';
import { ValidationError } from './errors';

export const validateSchema = <T>(schema: z.ZodSchema<T>, payload: unknown): T => {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ValidationError('Validation failed', parsed.error.format());
  }
  return parsed.data;
};
