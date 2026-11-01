'use strict';

const { validationResult } = require('express-validator');

/**
 * validate
 * Drop this after any array of express-validator check() rules in a route.
 *
 * Usage:
 *   router.post('/register', authValidationRules.register, validate, authController.register);
 */
const validate = (req, res, next) => {
  const result = validationResult(req);

  if (result.isEmpty()) return next();

  // Shape each field error consistently
  const errors = result.array().map((e) => ({
    field   : e.path,
    message : e.msg,
    value   : e.value !== undefined ? String(e.value) : undefined,
  }));

  const err      = new Error('Validation failed.');
  err.name       = 'ValidationError';
  err.statusCode = 422;
  err.errors     = errors;

  next(err);
};

module.exports = { validate };