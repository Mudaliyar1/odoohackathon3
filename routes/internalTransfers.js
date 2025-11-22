const express = require('express');
const router = express.Router();
const internalTransferController = require('../controllers/internalTransferController');
const { ensureAuthenticated } = require('../middleware/auth');

// Get all internal transfers
router.get('/', ensureAuthenticated, internalTransferController.internalTransferList);

// Create internal transfer form
router.get('/create', ensureAuthenticated, internalTransferController.internalTransferCreateGet);

// Create internal transfer
router.post('/create', ensureAuthenticated, internalTransferController.internalTransferCreatePost);

// Get single internal transfer details
router.get('/:id', ensureAuthenticated, internalTransferController.internalTransferDetail);

// Validate internal transfer
router.post('/:id/validate', ensureAuthenticated, internalTransferController.internalTransferValidate);
router.post('/:id/delete', ensureAuthenticated, internalTransferController.internalTransferDeletePost);

module.exports = router;