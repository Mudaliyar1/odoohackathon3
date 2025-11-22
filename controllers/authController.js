const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../services/emailService');

// Show Login Page
exports.showLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Login' });
};

// Handle Login
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'That email is not registered');
            return res.redirect('/auth/login');
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            req.flash('error_msg', 'Password incorrect');
            return res.redirect('/auth/login');
        }

        req.session.userId = user._id;
        req.session.role = user.role;
        req.flash('success_msg', 'You are now logged in');
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong');
        res.redirect('/auth/login');
    }
};

// Show Register Page
exports.showRegisterPage = (req, res) => {
    res.render('auth/register', { title: 'Register' });
};

// Handle Register
exports.register = async (req, res, next) => {
    const { name, email, password, password2, role } = req.body;
    let errors = [];

    // Check required fields
    if (!name || !email || !password || !password2 || !role) {
        errors.push({ msg: 'Please enter all fields' });
    }

    // Check passwords match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('auth/register', {
            errors,
            name,
            email,
            password,
            password2,
            role,
            title: 'Register'
        });
    } else {
        try {
            let user = await User.findOne({ email });
            if (user) {
                errors.push({ msg: 'Email already exists' });
                return res.render('auth/register', {
                    errors,
                    name,
                    email,
                    password,
                    password2,
                    role,
                    title: 'Register'
                });
            }

            user = new User({
                name,
                email,
                password,
                role
            });

            await user.save();
            req.flash('success_msg', 'You are now registered and can log in');
            res.redirect('/auth/login');

        } catch (err) {
            console.error(err);
            req.flash('error_msg', 'Something went wrong');
            res.redirect('/auth/register');
        }
    }
};

// Handle Logout
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid'); // Clear session cookie
        req.flash('success_msg', 'You are logged out');
        res.redirect('/auth/login');
    });
};

// Show Forgot Password Page
exports.showForgotPasswordPage = (req, res) => {
    res.render('auth/forgot', { title: 'Forgot Password' });
};

// Handle Forgot Password (Send OTP)
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'No user with that email address');
            return res.redirect('/auth/forgot');
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        // Save OTP to database
        await PasswordResetToken.deleteMany({ user: user._id }); // Clear any existing OTPs for the user
        const newOtp = new PasswordResetToken({ user: user._id, otp, expiresAt });
        await newOtp.save();

        // Send OTP email
        await sendOtpEmail(email, otp);

        req.flash('success_msg', 'OTP sent to your email address');
        res.redirect('/auth/verify-otp');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error sending OTP');
        res.redirect('/auth/forgot');
    }
};

// Show Verify OTP Page
exports.showVerifyOtpPage = (req, res) => {
    res.render('auth/verifyOtp', { title: 'Verify OTP' });
};

// Handle Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid email or OTP');
            return res.redirect('/auth/verify-otp');
        }

        const resetToken = await PasswordResetToken.findOne({
            user: user._id,
            otp,
            used: false,
            expiresAt: { $gt: Date.now() }
        });

        if (!resetToken) {
            req.flash('error_msg', 'Invalid or expired OTP');
            return res.redirect('/auth/verify-otp');
        }

        // Mark OTP as used
        resetToken.used = true;
        await resetToken.save();

        req.session.resetUserId = user._id; // Store user ID in session for password reset
        req.flash('success_msg', 'OTP verified successfully. You can now reset your password.');
        res.redirect('/auth/reset-password');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error verifying OTP');
        res.redirect('/auth/verify-otp');
    }
};

// Show Reset Password Page
exports.showResetPasswordPage = (req, res) => {
    if (!req.session.resetUserId) {
        req.flash('error_msg', 'Please verify OTP first');
        return res.redirect('/auth/forgot');
    }
    res.render('auth/resetPassword', { title: 'Reset Password' });
};

// Handle Reset Password
exports.resetPassword = async (req, res) => {
    const { password, password2 } = req.body;
    const userId = req.session.resetUserId;

    if (!userId) {
        req.flash('error_msg', 'Unauthorized. Please verify OTP again.');
        return res.redirect('/auth/forgot');
    }

    if (password !== password2) {
        req.flash('error_msg', 'Passwords do not match');
        return res.redirect('/auth/reset-password');
    }

    if (password.length < 6) {
        req.flash('error_msg', 'Password must be at least 6 characters');
        return res.redirect('/auth/reset-password');
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/auth/login');
        }

        user.password = password; // Mongoose pre-save hook will hash it
        await user.save();

        delete req.session.resetUserId; // Clear resetUserId from session
        req.flash('success_msg', 'Password successfully reset. You can now log in with your new password.');
        res.redirect('/auth/login');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error resetting password');
        res.redirect('/auth/reset-password');
    }
};