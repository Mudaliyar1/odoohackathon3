const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { ensureAuthenticated } = require('../middleware/auth');

// Get all receipts
router.get('/', ensureAuthenticated, receiptController.receiptList);

// Create receipt form
router.get('/create', ensureAuthenticated, receiptController.receiptCreateGet);

// Create receipt
router.post('/create', ensureAuthenticated, receiptController.receiptCreatePost);

// Get single receipt details
router.get('/:id', ensureAuthenticated, receiptController.receiptDetail);

// Validate receipt
router.post('/:id/validate', ensureAuthenticated, receiptController.receiptValidate);

// Delete receipt
router.post('/:id/delete', ensureAuthenticated, receiptController.receiptDeletePost);

// Download receipt PDF
router.get('/:id/download', ensureAuthenticated, receiptController.receiptDownloadPdf);

module.exports = router;