const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { ensureAuthenticated } = require('../middleware/auth');

// User Profile
router.get('/', ensureAuthenticated, userController.userProfile);

// Edit User Profile Form
router.get('/edit', ensureAuthenticated, userController.userProfileEditGet);

// Handle User Profile Update
router.post('/edit', ensureAuthenticated, userController.userProfileEditPost);

module.exports = router;