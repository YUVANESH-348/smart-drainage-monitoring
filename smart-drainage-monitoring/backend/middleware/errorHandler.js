// backend/middleware/errorHandler.js
//
// Custom error class + centralized error-handling middleware so
// controllers can just `throw new ApiError(400, 'message')` or
// `next(err)` and get a consistent JSON error response.

class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Wraps async route handlers so rejected promises reach errorHandler
// without needing try/catch in every controller function.
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  if (!err.statusCode) {
    // Only log unexpected (500-level) errors with full detail.
    console.error('[Unhandled error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

module.exports = { ApiError, asyncHandler, errorHandler, notFoundHandler };
