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

        const alerts = [];
        if (pendingReceipts > 0) {
            alerts.push({ type: 'warning', message: `You have ${pendingReceipts} pending receipts.` });
        }
        if (pendingDeliveries > 0) {
            alerts.push({ type: 'danger', message: `You have ${pendingDeliveries} pending deliveries.` });
        }
        if (pendingTransfers > 0) {
            alerts.push({ type: 'info', message: `You have ${pendingTransfers} pending internal transfers.` });
        }
        if (pendingAdjustments > 0) {
            alerts.push({ type: 'secondary', message: `You have ${pendingAdjustments} pending stock adjustments.` });
        }

        // Fetch data for weekly operations chart
        const today = new Date();
        const weeklyReceipts = [];
        const weeklyDeliveries = [];
        const labels = [];

        for (let i = 4; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const receiptsCount = await Receipt.countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            const deliveriesCount = await Delivery.countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });

            weeklyReceipts.push(receiptsCount);
            weeklyDeliveries.push(deliveriesCount);
            labels.push(startOfDay.toLocaleDateString('en-US', { weekday: 'short' }));
        }

        res.render('dashboard/index', {
            user: req.user,
            totalProducts,
            totalWarehouses,
            totalInventoryItems,
            pendingReceipts,
            pendingDeliveries,
            pendingTransfers,
            pendingAdjustments,
            weeklyReceipts,
            weeklyDeliveries,
            labels,
            alerts,
            title: 'Dashboard'
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching dashboard data');
        res.redirect('/dashboard');
    }
};