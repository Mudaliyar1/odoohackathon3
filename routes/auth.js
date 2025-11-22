const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/auth');

// Login Page
router.get('/login', forwardAuthenticated, authController.showLoginPage);
router.post('/login', authController.login);

// Register Page
router.get('/register', forwardAuthenticated, authController.showRegisterPage);
router.post('/register', authController.register);

// Logout
router.get('/logout', authController.logout);

// Forgot Password
router.get('/forgot', authController.showForgotPasswordPage);
router.post('/forgot', authController.forgotPassword);

// Verify OTP
router.get('/verify-otp', authController.showVerifyOtpPage);
router.post('/verify-otp', authController.verifyOtp);

// Reset Password
router.get('/reset-password', authController.showResetPasswordPage);
router.post('/reset-password', authController.resetPassword);

module.exports = router;