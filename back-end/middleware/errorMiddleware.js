'use strict';

/**
 * notFoundHandler
 * Catches any request that didn't match a registered route.
 */
const notFoundHandler = (req, res, next) => {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

/**
 * errorHandler
 * Global Express error-handling middleware (4-argument signature required).
 * Must be registered LAST in server.js after all routes.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // ── Defaults ────────────────────────────────────────────────────────────────
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors     = err.errors     || null;   // field-level validation errors

  // ── MySQL errors ─────────────────────────────────────────────────────────────
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message    = 'A record with that value already exists.';
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    statusCode = 400;
    message    = 'Referenced record does not exist.';
  }

  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    statusCode = 503;
    message    = 'Database connection error. Please try again later.';
  }

  // ── JWT errors (should be caught in authMiddleware, but as a safety net) ────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token expired.';
  }

  // ── express-validator errors forwarded as an array ───────────────────────────
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message    = 'Validation failed.';
    errors     = err.errors;
  }

  // ── Sanitise stack trace from production responses ───────────────────────────
  const response = {
    success   : false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      query: err.query || undefined,
    }),
  };

  // Log server errors
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${statusCode} — ${message}`);
    if (process.env.NODE_ENV === 'development') console.error(err.stack);
  }

  res.status(statusCode).json(response);
};

module.exports = { notFoundHandler, errorHandler };