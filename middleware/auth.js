const User = require('../models/User');

module.exports = {
    ensureAuthenticated: async function(req, res, next) {
        if (req.session.userId) {
            try {
                const user = await User.findById(req.session.userId);
                if (user) {
                    req.user = user;
                    return next();
                } else {
                    req.flash('error_msg', 'User not found');
                    return res.redirect('/auth/login');
                }
            } catch (err) {
                console.error(err);
                req.flash('error_msg', 'Error authenticating user');
                return res.redirect('/auth/login');
            }
        }
        req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/auth/login');
    },
    forwardAuthenticated: function(req, res, next) {
        if (!req.session.userId) {
            return next();
        }
        res.redirect('/dashboard');
    }
};