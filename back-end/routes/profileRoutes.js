'use strict';

const express = require('express');
const router  = express.Router();

const profileController  = require('../controllers/profileController');
const { protect }        = require('../middleware/authMiddleware');
const { validate }       = require('../middleware/validateMiddleware');
const profileValidator   = require('../validators/profileValidator');

router.use(protect);

router.get ('/',        profileController.getProfile);
router.put ('/',        profileValidator.updateProfile, validate, profileController.updateProfile);
router.get ('/goals',   profileController.getGoalsProgress);
router.delete('/account', profileController.deleteAccount);

module.exports = router;