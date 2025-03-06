import { MiddlewareHandler } from 'hono';
import { z } from 'zod';
import { ApiError, ValidationError } from '../utils/error';

export const validate = (schema: z.ZodTypeAny): MiddlewareHandler => {
  return async (c, next) => {
    try {
      const contentType = c.req.header('Content-Type');
      
      // Handle different content types
      let data: any;
      
      if (contentType?.includes('application/json')) {
        data = await c.req.json();
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await c.req.parseBody();
        data = formData;
      } else {
        // Default to JSON parsing
        try {
          data = await c.req.json();
        } catch (e) {
          throw ApiError.badRequest('Invalid request body format');
        }
      }
      
      // Validate against schema
      const result = schema.safeParse(data);
      
      if (!result.success) {
        // Format Zod error messages
        const formattedErrors = result.error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        throw new ValidationError(formattedErrors);
      }
      
      // Set validated data in request context
      c.set('validatedData', result.data);
      
      await next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw ApiError.badRequest('Invalid request data');
    }
  };
};