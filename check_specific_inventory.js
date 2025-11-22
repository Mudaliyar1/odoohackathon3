const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
const Product = require('./models/Product');
const Warehouse = require('./models/Warehouse');
require('dotenv').config();

async function checkSpecificInventory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        // Check inventory for the specific product "testing"
        const inventories = await Inventory.find({ product: '69216b8da0bca0b032ac2b50' })
            .populate('product')
            .populate('warehouse');
            
        console.log('Inventory for product "testing":', inventories.length);
        
        if (inventories.length === 0) {
            console.log('No inventory records found for this product!');
        } else {
            inventories.forEach(inv => {
                console.log(`Available: ${inv.available}, OnHand: ${inv.onHand}, Warehouse: ${inv.warehouse?.name || 'null'}`);
            });
        }
        
        // Also check all inventory records to see the pattern
        console.log('\nAll inventory records:');
        const allInventories = await Inventory.find({})
            .populate('product')
            .populate('warehouse');
            
        allInventories.forEach(inv => {
            console.log(`Product ID: ${inv.product?._id || 'null'}, Product Name: ${inv.product?.name || 'null'}, Available: ${inv.available}, OnHand: ${inv.onHand}, Warehouse: ${inv.warehouse?.name || 'null'}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSpecificInventory();