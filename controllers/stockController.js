const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Warehouse = require('../models/Warehouse');

exports.getStockScreen = async (req, res) => {
    try {
        const { search, warehouse, category } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.category = category;
        }

        const products = await Product.find(query).lean();
        const warehouses = await Warehouse.find({ isActive: true }).lean();

        let inventoryData = [];
        if (products.length > 0) {
            const productIds = products.map(p => p._id);
            let inventoryQuery = { product: { $in: productIds } };

            if (warehouse) {
                inventoryQuery.warehouse = warehouse;
            }

            inventoryData = await Inventory.find(inventoryQuery)
                .populate('product')
                .populate('warehouse')
                .populate('location')
                .lean();
        }

        res.render('stock/index', {
            user: req.user,
            products,
            warehouses,
            inventoryData,
            selectedSearch: search || '',
            selectedWarehouse: warehouse || '',
            selectedCategory: category || '',
            title: 'Stock Screen'
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching stock data');
        res.redirect('/dashboard');
    }
};