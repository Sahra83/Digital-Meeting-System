function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  if (statusCode === 422) {
    console.error(`[Validation Error] ${req.method} ${req.url}:`, JSON.stringify(error.details, null, 2));
  } else {
    console.error(`[Error ${statusCode}] ${req.method} ${req.url}:`, error.message);
  }

  res.status(statusCode).json({
    message: error.message || 'Internal server error',
    details: error.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
