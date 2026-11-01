'use strict';

const express = require('express');
const router  = express.Router();

const authController  = require('../controllers/authController');
const { protect }     = require('../middleware/authMiddleware');
const { validate }    = require('../middleware/validateMiddleware');
const authValidator   = require('../validators/authValidator');

// Public routes
router.post('/register', authValidator.register,        validate, authController.register);
router.post('/login',    authValidator.login,           validate, authController.login);
router.post('/refresh',                                           authController.refreshToken);

// Protected routes
router.get ('/me',              protect,                          authController.getMe);
router.patch('/change-password', protect, authValidator.changePassword, validate, authController.changePassword);

module.exports = router;