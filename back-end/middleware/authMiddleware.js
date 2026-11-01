'use strict';

const jwt    = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * protect
 * Verifies the Bearer JWT from the Authorization header.
 * Attaches the decoded user payload to req.user on success.
 */
const protect = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please log in again.',
          code: 'TOKEN_INVALID',
        });
      }
      throw err; // unknown JWT error → pass to global handler
    }

    // 3. Confirm user still exists in DB (protects against deleted accounts)
    const [rows] = await query(
      'SELECT id, name, email, currency, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4. Attach user to request
    req.user = rows[0];
    next();

  } catch (err) {
    next(err); // forward to global error handler
  }
};

/**
 * optionalAuth
 * Same as protect but does not reject unauthenticated requests.
 * Useful for public endpoints that behave differently for logged-in users.
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return protect(req, res, next);
};

module.exports = { protect, optionalAuth };