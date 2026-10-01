/**
 * Standardized API response helpers
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = null, extra = {}) => {
  const response = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  // Merge any extra metadata (e.g. pagination, summary statistics)
  Object.assign(response, extra);

  return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  errorResponse
};
