const User = require('../models/User');

// Display user profile on GET.
exports.userProfile = async (req, res) => {
    try {
        res.render('profile/index', { title: 'User Profile', user: req.user });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching user profile');
        res.redirect('/dashboard');
    }
};

// Display user profile edit form on GET.
exports.userProfileEditGet = async (req, res) => {
    try {
        res.render('profile/edit', { title: 'Edit Profile', user: req.user });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading profile edit form');
        res.redirect('/profile');
    }
};

// Handle user profile update on POST.
exports.userProfileEditPost = async (req, res) => {
    const { username, email } = req.body;
    let errors = [];

    if (!username || !email) {
        errors.push({ msg: 'Please enter all required fields' });
    }

    if (errors.length > 0) {
        return res.render('profile/edit', {
            title: 'Edit Profile',
            errors,
            user: { ...req.user, username, email }
        });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/profile');
        }

        user.username = username;
        user.email = email;

        await user.save();
        req.flash('success_msg', 'Profile updated successfully');
        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Username or Email already exists' });
        } else {
            errors.push({ msg: 'Error updating profile' });
        }
        res.render('profile/edit', {
            title: 'Edit Profile',
            errors,
            user: { ...req.user, username, email }
        });
    }
};