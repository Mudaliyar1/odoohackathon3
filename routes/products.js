const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const productController = require('../controllers/productController');

// All products
router.get('/', ensureAuthenticated, productController.productList);

// Kanban view for products
router.get('/kanban', ensureAuthenticated, productController.productKanban);

router.post('/updateStatus', ensureAuthenticated, productController.updateProductStatus);

router.get('/create', ensureAuthenticated, productController.productCreateGet);

// Create product submission
router.post('/create', ensureAuthenticated, productController.productCreatePost);

// Product detail
router.get('/:id', ensureAuthenticated, productController.productDetail);

// Edit product form
router.get('/:id/edit', ensureAuthenticated, productController.productUpdateGet);

// Edit product submission
router.post('/:id/edit', ensureAuthenticated, productController.productUpdatePost);

// Delete product
router.post('/:id/delete', ensureAuthenticated, productController.productDelete);

module.exports = router;