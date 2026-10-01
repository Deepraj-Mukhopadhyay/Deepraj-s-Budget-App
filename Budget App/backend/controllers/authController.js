const User = require('../models/User');
const { generateToken } = require('../utils/tokenUtils');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, members, currency } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return errorResponse(res, 400, 'Please provide your name.');
    }
    if (!email || !email.trim()) {
      return errorResponse(res, 400, 'Please provide an email address.');
    }
    if (!password || password.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long.');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return errorResponse(res, 409, 'An account with this email already exists.');
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      members: Array.isArray(members) && members.length > 0 ? members : undefined,
      currency: currency || 'INR'
    });

    // Generate JWT token
    const token = generateToken(user._id, user.email);

    return successResponse(res, 201, 'User registered successfully.', {
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !email.trim() || !password) {
      return errorResponse(res, 400, 'Please provide both email and password.');
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // Generate JWT token
    const token = generateToken(user._id, user.email);

    return successResponse(res, 200, 'Logged in successfully.', {
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'User profile retrieved successfully.', {
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile / preferences / members
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, members, currency, archivedMonths } = req.body;
    const user = req.user;

    if (name) user.name = name.trim();
    if (Array.isArray(members)) user.members = members;
    if (currency) user.currency = currency.trim();
    if (Array.isArray(archivedMonths)) user.archivedMonths = archivedMonths;

    await user.save();

    return successResponse(res, 200, 'Profile updated successfully.', {
      user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
