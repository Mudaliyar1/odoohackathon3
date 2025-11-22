const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const Receipt = require('../models/Receipt');
const Delivery = require('../models/Delivery');
const InternalTransfer = require('../models/InternalTransfer');
const StockAdjustment = require('../models/StockAdjustment');

exports.getDashboard = async (req, res) => {
    try {
        // Fetch data for KPIs
        const totalProducts = (await Product.countDocuments()) || 0;
        console.log('totalProducts:', totalProducts);
        const totalWarehouses = (await Warehouse.countDocuments()) || 0;
        const totalInventoryItems = (await Inventory.countDocuments()) || 0;
        const pendingReceipts = (await Receipt.countDocuments({ status: 'pending' })) || 0;
        const pendingDeliveries = (await Delivery.countDocuments({ status: 'pending' })) || 0;
        const pendingTransfers = (await InternalTransfer.countDocuments({ status: 'pending' })) || 0;
        const pendingAdjustments = (await StockAdjustment.countDocuments({ status: 'pending' })) || 0;

        // You can add more complex queries here for charts or recent activities

        res.render('dashboard/index', {
            user: req.user,
            totalProducts,
            totalWarehouses,
            totalInventoryItems,
            pendingReceipts,
            pendingDeliveries,
            pendingTransfers,
            pendingAdjustments,
            title: 'Dashboard'
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching dashboard data');
        res.redirect('/dashboard');
    }
};