const User = require('../models/User');
const PasswordResetToken = require('../models/PasswordResetToken');
const bcrypt = require('bcryptjs');
const { sendOtpEmail } = require('../services/emailService');

// Show Login Page
exports.showLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Login', currentTab: 'login', layout: './layouts/auth' });
};

// Handle Login
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'That email is not registered');
            return res.redirect('/auth');
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            req.flash('error_msg', 'Password incorrect');
            return res.redirect('/auth');
        }

        req.session.userId = user._id;
        req.session.role = user.role;
        req.flash('success_msg', 'You are now logged in');
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Something went wrong');
        res.redirect('/auth');
    }
};

// Show Register Page
exports.showRegisterPage = (req, res) => {
    res.render('auth/register', { title: 'Register', currentTab: 'register', layout: './layouts/auth' });
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
        res.render('auth/auth', {
            errors,
            name,
            email,
            password,
            password2,
            role,
            title: 'Register',
            currentTab: 'register'
        });
    } else {
        try {
            let user = await User.findOne({ email });
            if (user) {
                errors.push({ msg: 'Email already exists' });
                return res.render('auth/auth', {
                    errors,
                    name,
                    email,
                    password,
                    password2,
                    role,
                    title: 'Register',
                    currentTab: 'register'
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
            res.redirect('/auth');
        }
    }
};

// Handle Logout
exports.logout = (req, res) => {
    req.flash('success_msg', 'You are logged out');
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.redirect('/dashboard');
        }
        res.clearCookie('connect.sid'); // Clear session cookie
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
        res.redirect('/auth/verify-otp?email=' + email);

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error sending OTP');
        res.redirect('/auth/forgot');
    }
};

// Show Verify OTP Page
exports.showVerifyOtpPage = (req, res) => {
    const email = req.query.email || '';
    res.render('auth/verifyOtp', { title: 'Verify OTP', email });
};

// Handle Verify OTP
exports.verifyOtp = async (req, res) => {
    const { email, otp, password, password2 } = req.body;

    try {
        console.log('Verify OTP attempt for email:', email, 'OTP:', otp);
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error_msg', 'Invalid email or OTP');
            return res.redirect('/auth/verify-otp');
        }

        console.log('User found:', user._id);
        const resetToken = await PasswordResetToken.findOne({
            user: user._id,
            otp,
            used: false,
            expiresAt: { $gt: Date.now() }
        });

        console.log('Reset Token found:', resetToken);

        if (!resetToken) {
            req.flash('error_msg', 'Invalid or expired OTP');
            return res.redirect('/auth/verify-otp');
        }

        // If password fields are present, proceed with password reset
        if (password && password2) {
            if (password !== password2) {
                req.flash('error_msg', 'Passwords do not match');
                return res.redirect('/auth/verify-otp?otpVerified=true&email=' + email);
            }

            if (password.length < 6) {
                req.flash('error_msg', 'Password must be at least 6 characters');
                return res.redirect('/auth/verify-otp?otpVerified=true&email=' + email);
            }

            user.password = password; // Mongoose pre-save hook will hash it
            await user.save();

            resetToken.used = true;
            await resetToken.save();

            // Log the user in directly after password reset
            req.session.userId = user._id;
            req.session.role = user.role;

            req.flash('success_msg', 'Password successfully reset. You are now logged in.');
            return res.redirect('/dashboard');
        } else {
            // If only OTP is submitted, show the password reset fields
            req.flash('success_msg', 'OTP verified successfully. Please set your new password.');
            return res.redirect('/auth/verify-otp?otpVerified=true&email=' + email + '&otp=' + otp);
        }

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error verifying OTP or resetting password');
        res.redirect('/auth/verify-otp');
    }
};

// Show Reset Password Page