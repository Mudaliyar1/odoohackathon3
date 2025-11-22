const express = require('express');
const router = express.Router();
const stockAdjustmentController = require('../controllers/stockAdjustmentController');
const { ensureAuthenticated } = require('../middleware/auth');

// Stock Adjustment List
router.get('/', ensureAuthenticated, stockAdjustmentController.stockAdjustmentList);

// Create Stock Adjustment Form
router.get('/create', ensureAuthenticated, stockAdjustmentController.stockAdjustmentCreateGet);

// Handle Stock Adjustment Creation
router.post('/create', ensureAuthenticated, stockAdjustmentController.stockAdjustmentCreatePost);

// Stock Adjustment Detail
router.get('/:id', ensureAuthenticated, stockAdjustmentController.stockAdjustmentDetail);

// Validate Stock Adjustment
router.post('/:id/validate', ensureAuthenticated, stockAdjustmentController.stockAdjustmentValidate);

module.exports = router;