'use strict';

const express = require('express');
const router  = express.Router();

const transactionController = require('../controllers/transactionController');
const { protect }           = require('../middleware/authMiddleware');
const { validate }          = require('../middleware/validateMiddleware');
const transactionValidator  = require('../validators/transactionValidator');

// All transaction routes require authentication
router.use(protect);

router.route('/')
  .get (transactionValidator.getAll, validate, transactionController.getTransactions)
  .post(transactionValidator.create, validate, transactionController.createTransaction);

router.get('/summary', transactionController.getTransactionSummary);

router.route('/:id')
  .get   (transactionValidator.idParam, validate, transactionController.getTransactionById)
  .put   (transactionValidator.update,  validate, transactionController.updateTransaction)
  .delete(transactionValidator.idParam, validate, transactionController.deleteTransaction);

module.exports = router;