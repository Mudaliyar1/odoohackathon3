const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { ensureAuthenticated } = require('../middleware/auth');

// Location List
router.get('/', ensureAuthenticated, locationController.locationList);

// Create Location Form
router.get('/create', ensureAuthenticated, locationController.locationCreateGet);

// Handle Location Creation
router.post('/create', ensureAuthenticated, locationController.locationCreatePost);

// Location Detail
router.get('/:id', ensureAuthenticated, locationController.locationDetail);

// Update Location Form
router.get('/:id/edit', ensureAuthenticated, locationController.locationUpdateGet);

// Handle Location Update
router.post('/:id/edit', ensureAuthenticated, locationController.locationUpdatePost);

// Handle Location Delete
router.post('/:id/delete', ensureAuthenticated, locationController.locationDelete);

module.exports = router;