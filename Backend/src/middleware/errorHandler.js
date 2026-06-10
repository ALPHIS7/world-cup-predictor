import { logger } from '../utils/logger.js';

// 404 for unmatched routes.
export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
}

// Central error handler. Maps ApiError -> status code, everything else -> 500.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.isApiError ? err.statusCode : 500;
  if (status >= 500) {
    logger.error('Unhandled error:', err);
  }
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(err.details ? { details: err.details } : {}),
  });
}
