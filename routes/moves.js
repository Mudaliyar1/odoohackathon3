const express = require('express');
const router = express.Router();
const moveHistoryController = require('../controllers/moveHistoryController');
const { ensureAuthenticated } = require('../middleware/auth');

// Move History List
router.get('/', ensureAuthenticated, moveHistoryController.moveHistoryList);

module.exports = router;