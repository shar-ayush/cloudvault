// backend/src/middleware/errorHandler.js
// Global Express error handler

const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${err.name || 'Error'}: ${err.message}`);

  // JWT / Unauthorized errors from express-jwt
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: err.message || 'Invalid or missing authentication token',
      statusCode: 401,
    });
  }

  // Validation errors (manually thrown with name = 'ValidationError')
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message || 'Bad request',
      statusCode: 400,
    });
  }

  // Multer file-size limit
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File size exceeds the 50 MB limit',
      statusCode: 400,
    });
  }

  // Default — Internal Server Error
  return res.status(500).json({
    error: err.message || 'Internal server error',
    statusCode: 500,
  });
};

module.exports = { errorHandler };
