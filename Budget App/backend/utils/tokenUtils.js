const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {string} - Signed JWT
 */
const generateToken = (userId, email) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_mode';
  const expiresIn = process.env.JWT_EXPIRE || '30d';

  return jwt.sign(
    { id: userId, email },
    secret,
    { expiresIn }
  );
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token string
 * @returns {object} - Decoded payload
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_for_dev_mode';
  return jwt.verify(token, secret);
};

module.exports = {
  generateToken,
  verifyToken
};
