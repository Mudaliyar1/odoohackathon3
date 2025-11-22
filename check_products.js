const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

async function checkProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const products = await Product.find({});
        console.log('Total products:', products.length);
        
        if (products.length === 0) {
            console.log('No products found!');
        } else {
            products.forEach(p => {
                console.log(`Product: ${p.name}, ID: ${p._id}, Quantity: ${p.quantity}`);
            });
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkProducts();