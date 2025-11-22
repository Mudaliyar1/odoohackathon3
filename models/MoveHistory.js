const mongoose = require('mongoose');

const MoveHistorySchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    fromLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    toLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    fromWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    toWarehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Warehouse',
        required: true
    },
    moveType: {
        type: String,
        enum: ['receipt', 'delivery', 'transfer', 'adjustment'],
        required: true
    },
    document: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'moveType'
    },
    movedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MoveHistory', MoveHistorySchema);