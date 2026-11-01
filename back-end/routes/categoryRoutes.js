'use strict';

const express = require('express');
const router  = express.Router();

const categoryController = require('../controllers/categoryController');
const { protect }        = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get (categoryController.getCategories)
  .post(categoryController.createCategory);

router.route('/:id')
  .get   (categoryController.getCategoryById)
  .put   (categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

module.exports = router;