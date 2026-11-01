'use strict';

const { body, query, param } = require('express-validator');

const VALID_TYPES = ['income', 'expense'];

const create = [
  body('type')
    .notEmpty().withMessage('Transaction type is required.')
    .isIn(VALID_TYPES).withMessage('Type must be either "income" or "expense".'),

  body('amount')
    .notEmpty().withMessage('Amount is required.')
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be a positive number no greater than 999,999,999.99.')
    .toFloat(),

  body('category_id')
    .notEmpty().withMessage('Category is required.')
    .isInt({ min: 1 }).withMessage('Category must be a valid ID.')
    .toInt(),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),

  body('transaction_date')
    .notEmpty().withMessage('Transaction date is required.')
    .isISO8601().withMessage('Transaction date must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate(),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters.'),
];

const update = [
  param('id')
    .isInt({ min: 1 }).withMessage('Transaction ID must be a valid integer.').toInt(),

  body('type')
    .optional()
    .isIn(VALID_TYPES).withMessage('Type must be either "income" or "expense".'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 999999999.99 })
    .withMessage('Amount must be a positive number no greater than 999,999,999.99.')
    .toFloat(),

  body('category_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Category must be a valid ID.')
    .toInt(),

  body('description')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),

  body('transaction_date')
    .optional()
    .isISO8601().withMessage('Transaction date must be a valid ISO 8601 date (YYYY-MM-DD).')
    .toDate(),

  body('notes')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters.'),
];

const getAll = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100.')
    .toInt(),

  query('type')
    .optional()
    .isIn(VALID_TYPES).withMessage('Type filter must be "income" or "expense".'),

  query('category_id')
    .optional()
    .isInt({ min: 1 }).withMessage('Category ID must be a valid integer.')
    .toInt(),

  query('start_date')
    .optional()
    .isISO8601().withMessage('start_date must be a valid ISO 8601 date.'),

  query('end_date')
    .optional()
    .isISO8601().withMessage('end_date must be a valid ISO 8601 date.'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Search term must not exceed 100 characters.'),

  query('sort_by')
    .optional()
    .isIn(['transaction_date', 'amount', 'created_at'])
    .withMessage('sort_by must be one of: transaction_date, amount, created_at.'),

  query('sort_order')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('sort_order must be ASC or DESC.'),
];

const idParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('Transaction ID must be a valid integer.')
    .toInt(),
];

module.exports = { create, update, getAll, idParam };