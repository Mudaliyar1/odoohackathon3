require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const path = require('path');
const connectDB = require('./config/database');
const sessionConfig = require('./config/session');
const { ensureAuthenticated } = require('./middleware/auth');

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', './layouts/main');

// Make moment available in all EJS templates
app.locals.moment = require('moment');

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Session Middleware
app.use(sessionConfig);

// Connect Flash
app.use(flash());

// Global Variables for Flash Messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/stock', require('./routes/stock'));
app.use('/products', require('./routes/products'));
app.use('/receipts', require('./routes/receipts'));
app.use('/deliveries', require('./routes/deliveries'));
app.use('/internalTransfers', require('./routes/internalTransfers'));
app.use('/adjustments', require('./routes/stockAdjustments'));
app.use('/moves', require('./routes/moves'));
app.use('/warehouses', require('./routes/warehouses'));
app.use('/locations', require('./routes/locations'));
app.use('/profile', require('./routes/profile'));
app.get('/', ensureAuthenticated, require('./controllers/dashboardController').getDashboard);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});