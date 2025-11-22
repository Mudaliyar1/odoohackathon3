const mongoose = require('mongoose');
const Inventory = require('./models/Inventory');
const Product = require('./models/Product');
const Warehouse = require('./models/Warehouse');
require('dotenv').config();

async function checkInventory() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const inventories = await Inventory.find({})
            .populate('product')
            .populate('warehouse');
            
        console.log('Total inventory records:', inventories.length);
        
        if (inventories.length === 0) {
            console.log('No inventory records found!');
        } else {
            inventories.forEach(inv => {
                console.log(`Product: ${inv.product?.name || 'null'}, Warehouse: ${inv.warehouse?.name || 'null'}, Available: ${inv.available}, OnHand: ${inv.onHand}`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkInventory();