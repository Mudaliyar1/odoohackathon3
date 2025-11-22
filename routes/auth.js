const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/auth');

// Auth Page (Login/Register)
router.get('/login', forwardAuthenticated, authController.showLoginPage);
router.get('/register', forwardAuthenticated, authController.showRegisterPage);
router.post('/login', authController.login);
router.post('/register', authController.register);

// Logout
router.get('/logout', authController.logout);

// Forgot Password
router.get('/forgot', authController.showForgotPasswordPage);
router.post('/forgot', authController.forgotPassword);

// Verify OTP
router.get('/verify-otp', authController.showVerifyOtpPage);
router.post('/verify-otp', authController.verifyOtp);



module.exports = router;