const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { ensureAuthenticated } = require('../middleware/auth');

router.get('/kanban', ensureAuthenticated, deliveryController.deliveryKanban);

// Get all deliveries
router.get('/', ensureAuthenticated, deliveryController.deliveryList);

// Create delivery form
router.get('/create', ensureAuthenticated, deliveryController.deliveryCreateGet);

// Create delivery
router.post('/create', ensureAuthenticated, deliveryController.deliveryCreatePost);

// Get single delivery details
router.get('/:id', ensureAuthenticated, deliveryController.deliveryDetail);

router.post('/:id/status', ensureAuthenticated, deliveryController.deliveryUpdateStatus);

// Validate delivery
router.post('/:id/validate', ensureAuthenticated, deliveryController.deliveryValidate);

// Download delivery PDF
router.get('/:id/download', ensureAuthenticated, deliveryController.deliveryDownloadPdf);

// Delete delivery
router.post('/:id/delete', ensureAuthenticated, deliveryController.deliveryDeletePost);

module.exports = router;