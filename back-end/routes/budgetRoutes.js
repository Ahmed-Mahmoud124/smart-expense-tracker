'use strict';

const express = require('express');
const router  = express.Router();

const budgetController = require('../controllers/budgetController');
const { protect }      = require('../middleware/authMiddleware');
const { validate }     = require('../middleware/validateMiddleware');
const budgetValidator  = require('../validators/budgetValidator');

router.use(protect);

router.get('/alerts', budgetController.getBudgetAlerts);

router.route('/')
  .get (budgetController.getBudgets)
  .post(budgetValidator.create, validate, budgetController.createBudget);

router.route('/:id')
  .get   (budgetValidator.idParam, validate, budgetController.getBudgetById)
  .put   (budgetValidator.update,  validate, budgetController.updateBudget)
  .delete(budgetValidator.idParam, validate, budgetController.deleteBudget);

module.exports = router;