import { Request, Response, NextFunction } from 'express';

/**
 * Global Express error handling middleware.
 * Formats uncaught exceptions into standard JSON error responses.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Unhandled Server Error:', err);

  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred.';
  const details = err.details || [];

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};
