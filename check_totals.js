const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
const Product = require('./models/Product');
const Warehouse = require('./models/Warehouse');
require('dotenv').config();

async function checkProductTotals() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        console.log('Product ID: 69216b8da0bca0b032ac2b50');
        const inventories = await Inventory.find({ product: '69216b8da0bca0b032ac2b50' })
            .populate('product')
            .populate('warehouse');
            
        console.log('Total inventory records for this product:', inventories.length);
        
        let totalAvailable = 0;
        let totalOnHand = 0;
        
        inventories.forEach(inv => {
            totalAvailable += inv.available;
            totalOnHand += inv.onHand;
            console.log(`Warehouse: ${inv.warehouse?.name}, Available: ${inv.available}, OnHand: ${inv.onHand}`);
        });
        
        console.log('Total Available across all warehouses:', totalAvailable);
        console.log('Total OnHand across all warehouses:', totalOnHand);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProductTotals();