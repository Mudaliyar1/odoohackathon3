const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: false // Location can be null if not specified
    },
    onHand: {
        type: Number,
        default: 0
    },
    reserved: {
        type: Number,
        default: 0
    },
    available: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update `updatedAt` field on save
InventorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Ensure unique combination of product, warehouse, and location
InventorySchema.index({ product: 1, warehouse: 1, location: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', InventorySchema);