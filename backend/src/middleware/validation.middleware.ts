import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware to validate request components (body, query, params) against a Zod schema.
 * Returns 422 Unprocessable Entity if validation fails.
 */
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Override request data with fully typed and parsed outputs (resolves defaults/coercions)
      req.body = parsed.body || req.body;
      req.query = parsed.query || req.query;
      req.params = parsed.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request payload.',
            details: error.errors.map((err) => ({
              field: err.path.slice(1).join('.'), // Remove 'body', 'query', or 'params' prefix from path
              message: err.message,
            })),
          },
        });
        return;
      }
      next(error);
    }
  };
};
