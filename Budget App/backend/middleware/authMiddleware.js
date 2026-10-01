const { verifyToken } = require('../utils/tokenUtils');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHandler');

/**
 * Authentication middleware protecting private routes.
 * Checks for Bearer token in Authorization header,
 * verifies it, and attaches the authenticated user to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 401, 'Access denied. No authorization token provided.');
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return errorResponse(res, 401, 'User account no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired. Please log in again.');
    }
    return errorResponse(res, 401, 'Invalid authorization token.');
  }
};

module.exports = {
  protect
};
