/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns JSON responses
 */

function errorHandler(err, req, res, next) {
  // Log full error details
  console.error('='.repeat(80));
  console.error('[ERROR HANDLER] Unhandled Error:');
  console.error('Time:', new Date().toISOString());
  console.error('Method:', req.method);
  console.error('Path:', req.path);
  console.error('User:', req.user?.id || 'Not authenticated');
  console.error('Error Message:', err.message);
  console.error('Error Stack:', err.stack);
  console.error('='.repeat(80));

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    path: req.path,
    timestamp: new Date().toISOString()
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = err.details;
  }

  // Send JSON response
  res.status(statusCode).json(errorResponse);
}

/**
 * Async handler wrapper to catch promise rejections
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler
};
