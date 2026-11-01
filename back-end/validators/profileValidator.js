'use strict';

const { body } = require('express-validator');

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'EGP', 'SAR', 'AED', 'JPY', 'CAD', 'AUD', 'CHF'];

const updateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters.')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name may only contain letters, spaces, hyphens, and apostrophes.'),

  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email must not exceed 255 characters.'),

  body('currency')
    .optional()
    .isIn(SUPPORTED_CURRENCIES)
    .withMessage(`Currency must be one of: ${SUPPORTED_CURRENCIES.join(', ')}.`),

  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Timezone must not exceed 100 characters.'),

  body('monthly_income_goal')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 999999999.99 })
    .withMessage('Monthly income goal must be a positive number.')
    .toFloat(),

  body('monthly_expense_limit')
    .optional({ nullable: true })
    .isFloat({ min: 0, max: 999999999.99 })
    .withMessage('Monthly expense limit must be a positive number.')
    .toFloat(),
];

module.exports = { updateProfile };