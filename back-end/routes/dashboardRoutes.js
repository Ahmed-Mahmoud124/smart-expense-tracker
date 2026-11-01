'use strict';

const express = require('express');
const router  = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { protect }         = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary',            dashboardController.getDashboardSummary);
router.get('/analytics/monthly',  dashboardController.getMonthlyAnalytics);
router.get('/analytics/category', dashboardController.getCategoryBreakdown);
router.get('/analytics/daily',    dashboardController.getDailySpending);
router.get('/analytics/yearly',   dashboardController.getYearlyComparison);

module.exports = router;