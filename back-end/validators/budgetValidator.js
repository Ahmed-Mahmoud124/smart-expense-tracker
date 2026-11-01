'use strict';

const { body, param } = require('express-validator');

const VALID_PERIODS = ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'];

const create = [
  body('name')
    .trim()
    .notEmpty().withMessage('Budget name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Budget name must be between 2 and 100 characters.'),

  body('amount')
    .notEmpty().withMessage('Budget amount is required.')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be a positive number no greater than 999,999,999.99.')
    .toFloat(),

  body('period')
    .notEmpty().withMessage('Budget period is required.')
    .isIn(VALID_PERIODS)
    .withMessage(`Period must be one of: ${VALID_PERIODS.join(', ')}.`),

  body('category_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Category must be a valid ID.')
    .toInt(),

  body('start_date')
    .notEmpty().withMessage('Start date is required.')
    .isISO8601().withMessage('Start date must be a valid ISO 8601 date.')
    .toDate(),

  body('end_date')
    .notEmpty().withMessage('End date is required.')
    .isISO8601().withMessage('End date must be a valid ISO 8601 date.')
    .toDate()
    .custom((endDate, { req }) => {
      const startDate = new Date(req.body.start_date);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date.');
      }
      return true;
    }),

  body('alert_threshold')
    .optional({ nullable: true })
    .isFloat({ min: 1, max: 100 })
    .withMessage('Alert threshold must be a percentage between 1 and 100.')
    .toFloat(),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters.'),
];

const update = [
  param('id')
    .isInt({ min: 1 }).withMessage('Budget ID must be a valid integer.')
    .toInt(),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Budget name must be between 2 and 100 characters.'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be a positive number no greater than 999,999,999.99.')
    .toFloat(),

  body('period')
    .optional()
    .isIn(VALID_PERIODS)
    .withMessage(`Period must be one of: ${VALID_PERIODS.join(', ')}.`),

  body('category_id')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('Category must be a valid ID.')
    .toInt(),

  body('start_date')
    .optional()
    .isISO8601().withMessage('Start date must be a valid ISO 8601 date.')
    .toDate(),

  body('end_date')
    .optional()
    .isISO8601().withMessage('End date must be a valid ISO 8601 date.')
    .toDate()
    .custom((endDate, { req }) => {
      if (req.body.start_date) {
        const startDate = new Date(req.body.start_date);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date.');
        }
      }
      return true;
    }),

  body('alert_threshold')
    .optional({ nullable: true })
    .isFloat({ min: 1, max: 100 })
    .withMessage('Alert threshold must be a percentage between 1 and 100.')
    .toFloat(),

  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean value.')
    .toBoolean(),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters.'),
];

const idParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Budget ID must be a valid integer.')
    .toInt(),
];

module.exports = { create, update, idParam };