const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const stockController = require('../controllers/stockController');

// Stock Screen Page
router.get('/', ensureAuthenticated, stockController.getStockScreen);

module.exports = router;