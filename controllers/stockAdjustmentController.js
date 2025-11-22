const StockAdjustment = require('../models/StockAdjustment');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');

// Display list of all stock adjustments.
exports.stockAdjustmentList = async (req, res) => {
    try {
        const adjustments = await StockAdjustment.find({})
            .populate('warehouse')
            .populate('createdBy')
            .sort({ createdAt: -1 });
        res.render('adjustments/index', { title: 'Stock Adjustment List', adjustments });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching stock adjustments');
        res.redirect('/dashboard');
    }
};

// Display stock adjustment create form on GET.
exports.stockAdjustmentCreateGet = async (req, res) => {
    try {
        const products = await Product.find({});
        const warehouses = await Warehouse.find({});
        res.render('adjustments/create', { title: 'Create Stock Adjustment', products, warehouses });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading stock adjustment creation form');
        res.redirect('/adjustments');
    }
};

// Handle stock adjustment create on POST.
exports.stockAdjustmentCreatePost = async (req, res) => {
    const { documentNumber, warehouse, type, products } = req.body;
    let errors = [];

    if (!documentNumber || !warehouse || !type || !products || products.length === 0) {
        errors.push({ msg: 'Please enter all required fields and at least one product' });
    }

    if (errors.length > 0) {
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        return res.render('adjustments/create', {
            title: 'Create Stock Adjustment',
            errors,
            documentNumber,
            warehouse,
            type,
            products: allProducts,
            warehouses: allWarehouses
        });
    }

    try {
        const newAdjustment = new StockAdjustment({
            documentNumber,
            warehouse,
            type,
            lines: products.map(p => ({ 
                product: p.id, 
                quantity: p.quantity,
                adjustmentType: type === 'in' ? 'increase' : 'decrease'
            })),
            createdBy: req.user._id
        });

        await newAdjustment.save();
        req.flash('success_msg', 'Stock Adjustment created successfully');
        res.redirect('/adjustments');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Document Number already exists' });
        } else {
            errors.push({ msg: 'Error creating stock adjustment' });
        }
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        res.render('adjustments/create', {
            title: 'Create Stock Adjustment',
            errors,
            documentNumber,
            warehouse,
            type,
            products: allProducts,
            warehouses: allWarehouses
        });
    }
};

// Display stock adjustment detail on GET.
exports.stockAdjustmentDetail = async (req, res) => {
    try {
        const adjustment = await StockAdjustment.findById(req.params.id)
            .populate('warehouse')
            .populate('createdBy')
            .populate('validatedBy')
            .populate('lines.product');

        if (!adjustment) {
            req.flash('error_msg', 'Stock Adjustment not found');
            return res.redirect('/adjustments');
        }
        res.render('adjustments/detail', { title: 'Stock Adjustment Detail', adjustment });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching stock adjustment details');
        res.redirect('/adjustments');
    }
};

// Handle stock adjustment validation on POST.
exports.stockAdjustmentValidate = async (req, res) => {
    try {
        const adjustment = await StockAdjustment.findById(req.params.id).populate('lines.product');

        if (!adjustment) {
            req.flash('error_msg', 'Stock Adjustment not found');
            return res.redirect('/adjustments');
        }

        if (adjustment.status !== 'pending') {
            req.flash('error_msg', 'Stock Adjustment already processed.');
            return res.redirect('/adjustments/' + adjustment._id);
        }

        // Update inventory based on adjustment type
        for (const line of adjustment.lines) {
            let inventoryItem = await Inventory.findOne({ product: line.product._id, warehouse: adjustment.warehouse });

            if (adjustment.type === 'in') {
                if (inventoryItem) {
                    inventoryItem.onHand += line.quantity;
                    inventoryItem.available += line.quantity;
                    await inventoryItem.save();
                } else {
                    const newInventoryItem = new Inventory({
                        product: line.product._id,
                        warehouse: adjustment.warehouse,
                        onHand: line.quantity,
                        available: line.quantity
                    });
                    await newInventoryItem.save();
                }
            } else if (adjustment.type === 'out') {
                if (!inventoryItem || inventoryItem.available < line.quantity) {
                    req.flash('error_msg', `Not enough ${line.product.name} in stock for this adjustment.`);
                    return res.redirect('/adjustments/' + adjustment._id);
                }
                inventoryItem.onHand -= line.quantity;
                inventoryItem.available -= line.quantity;
                await inventoryItem.save();
            }
        }

        adjustment.status = 'completed';
        adjustment.validatedBy = req.user._id;
        adjustment.validationDate = Date.now();
        await adjustment.save();

        req.flash('success_msg', 'Stock Adjustment validated and inventory updated successfully');
        res.redirect('/adjustments/' + adjustment._id);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error validating stock adjustment');
        res.redirect('/adjustments');
    }
};