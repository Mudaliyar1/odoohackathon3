const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { ensureAuthenticated } = require('../middleware/auth');

// Warehouse List
router.get('/', ensureAuthenticated, warehouseController.warehouseList);

// Create Warehouse Form
router.get('/create', ensureAuthenticated, warehouseController.warehouseCreateGet);

// Handle Warehouse Creation
router.post('/create', ensureAuthenticated, warehouseController.warehouseCreatePost);

// Warehouse Detail
router.get('/:id', ensureAuthenticated, warehouseController.warehouseDetail);

// Update Warehouse Form
router.get('/:id/edit', ensureAuthenticated, warehouseController.warehouseUpdateGet);

// Handle Warehouse Update
router.post('/:id/edit', ensureAuthenticated, warehouseController.warehouseUpdatePost);

// Handle Warehouse Delete
router.post('/:id/delete', ensureAuthenticated, warehouseController.warehouseDelete);

module.exports = router;