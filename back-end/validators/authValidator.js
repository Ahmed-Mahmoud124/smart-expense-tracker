'use strict';

const { body } = require('express-validator');

const register = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters.')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name may only contain letters, spaces, hyphens, and apostrophes.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    .isLength({ max: 128 }).withMessage('Password must not exceed 128 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
    .withMessage('Password must contain at least one special character.'),

  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED', 'JPY', 'CAD', 'AUD', 'CHF'])
    .withMessage('Unsupported currency code.'),
];

const login = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

const changePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required.'),

  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long.')
    .isLength({ max: 128 }).withMessage('New password must not exceed 128 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain at least one number.')
    .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/)
    .withMessage('New password must contain at least one special character.')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from the current password.');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required.')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

module.exports = { register, login, changePassword };