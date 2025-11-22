const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
require('dotenv').config();

async function updateInventory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const result = await Inventory.updateOne(
            { product: '69216b8da0bca0b032ac2b50' }, 
            { $set: { available: 200, onHand: 200 } }
        );
        
        console.log('Updated inventory record:', result.modifiedCount);
        
        // Verify the update
        const updated = await Inventory.findOne({ product: '69216b8da0bca0b032ac2b50' });
        console.log('Updated values - Available:', updated.available, 'OnHand:', updated.onHand);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateInventory();