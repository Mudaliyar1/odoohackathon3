const InternalTransfer = require('../models/InternalTransfer');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');

// Display list of all internal transfers.
exports.internalTransferList = async (req, res) => {
    try {
        const transfers = await InternalTransfer.find({})
            .populate('fromWarehouse')
            .populate('toWarehouse')
            .populate('createdBy')
            .sort({ createdAt: -1 });
        res.render('internalTransfers/index', { title: 'Internal Transfer List', transfers });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching internal transfers');
        res.redirect('/dashboard');
    }
};

// Display internal transfer create form on GET.
exports.internalTransferCreateGet = async (req, res) => {
    try {
        const products = await Product.find({});
        const warehouses = await Warehouse.find({});
        
        // Fetch inventory data for all products in all warehouses
        const inventoryData = await Inventory.find({})
            .populate('product')
            .populate('warehouse');
        
        // Create inventory map for easy lookup
        const inventoryMap = {};
        inventoryData.forEach(item => {
            if (item.product && item.warehouse) {
                const key = `${item.product._id}-${item.warehouse._id}`;
                inventoryMap[key] = {
                    available: item.available,
                    onHand: item.onHand
                };
            }
        });
        
        res.render('internalTransfers/create', { 
            title: 'Create Internal Transfer', 
            products, 
            warehouses,
            inventoryMap: JSON.stringify(inventoryMap)
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading internal transfer creation form');
        res.redirect('/internalTransfers');
    }
};

// Handle internal transfer delete on POST.
exports.internalTransferDeletePost = async (req, res) => {
    try {
        await InternalTransfer.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Internal Transfer deleted successfully');
        res.redirect('/internalTransfers');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting internal transfer');
        res.redirect('/internalTransfers');
    }
};

// Handle internal transfer create on POST.
exports.internalTransferCreatePost = async (req, res) => {
    const { sourceWarehouse, destinationWarehouse, products } = req.body;
    let errors = [];

    if (!sourceWarehouse || !destinationWarehouse || !products || products.length === 0) {
        errors.push({ msg: 'Please enter all required fields and at least one product' });
    }

    if (sourceWarehouse === destinationWarehouse) {
        errors.push({ msg: 'Source and Destination warehouses cannot be the same' });
    }

    // Validate product quantities against available inventory
    if (products && products.length > 0) {
        for (const product of products) {
            if (product.id && product.quantity) {
                const inventory = await Inventory.findOne({ 
                    product: product.id, 
                    warehouse: sourceWarehouse 
                });
                
                const available = inventory ? inventory.available : 0;
                if (available < product.quantity) {
                    const productData = await Product.findById(product.id);
                    errors.push({ 
                        msg: `Insufficient quantity for ${productData.name}. Available: ${available}, Requested: ${product.quantity}` 
                    });
                }
            }
        }
    }

    if (errors.length > 0) {
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        
        // Fetch inventory data for error case
        const inventoryData = await Inventory.find({})
            .populate('product')
            .populate('warehouse');
        
        const inventoryMap = {};
        inventoryData.forEach(item => {
            if (item.product && item.warehouse) {
                const key = `${item.product._id}-${item.warehouse._id}`;
                inventoryMap[key] = {
                    available: item.available,
                    onHand: item.onHand
                };
            }
        });
        
        return res.render('internalTransfers/create', {
            title: 'Create Internal Transfer',
            errors,
            sourceWarehouse,
            destinationWarehouse,
            products: allProducts,
            warehouses: allWarehouses,
            inventoryMap: JSON.stringify(inventoryMap)
        });
    }

    try {
        const documentNumber = `IT-${Date.now()}`;
        const newTransfer = new InternalTransfer({
            documentNumber,
            fromWarehouse: sourceWarehouse,
            toWarehouse: destinationWarehouse,
            lines: products.map(p => ({ product: p.id, quantity: p.quantity })),
            createdBy: req.user._id
        });

        await newTransfer.save();
        req.flash('success_msg', 'Internal Transfer created successfully');
        res.redirect('/internalTransfers');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Document Number already exists' });
        } else {
            errors.push({ msg: 'Error creating internal transfer' });
        }
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        res.render('internalTransfers/create', {
            title: 'Create Internal Transfer',
            errors,
            documentNumber,
            sourceWarehouse,
            destinationWarehouse,
            products: allProducts,
            warehouses: allWarehouses
        });
    }
};

// Display internal transfer detail on GET.
exports.internalTransferDetail = async (req, res) => {
    try {
        const transfer = await InternalTransfer.findById(req.params.id)
            .populate('fromWarehouse')
            .populate('toWarehouse')
            .populate('createdBy')
            .populate('validatedBy')
            .populate('lines.product');

        if (!transfer) {
            req.flash('error_msg', 'Internal Transfer not found');
            return res.redirect('/internalTransfers');
        }
        res.render('internalTransfers/detail', { title: 'Internal Transfer Detail', transfer });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching internal transfer details');
        res.redirect('/internalTransfers');
    }
};

// Handle internal transfer validation on POST.
exports.internalTransferValidate = async (req, res) => {
    try {
        const transfer = await InternalTransfer.findById(req.params.id).populate('lines.product');
        console.log('Transfer before validation:', transfer);

        if (!transfer) {
            req.flash('error_msg', 'Internal Transfer not found');
            return res.redirect('/internalTransfers');
        }

        if (transfer.status !== 'pending') {
            req.flash('error_msg', 'Internal Transfer already processed.');
            return res.redirect('/internalTransfers/' + transfer._id);
        }

        // Deduct from source warehouse and add to destination warehouse
        for (const line of transfer.lines) {
            // Deduct from source
            let sourceInventory = await Inventory.findOne({ product: line.product._id, warehouse: transfer.fromWarehouse });
            console.log('Source Inventory before update:', sourceInventory);
            if (!sourceInventory || sourceInventory.available < line.quantity) {
                req.flash('error_msg', `Not enough ${line.product.name} in source warehouse for this transfer.`);
                return res.redirect('/internalTransfers/' + transfer._id);
            }
            sourceInventory.onHand -= line.quantity;
            sourceInventory.available -= line.quantity;
            await sourceInventory.save();
            console.log('Source Inventory after update:', sourceInventory);

            // Add to destination
            let destinationInventory = await Inventory.findOne({ product: line.product._id, warehouse: transfer.toWarehouse });
            console.log('Destination Inventory before update:', destinationInventory);
            if (destinationInventory) {
                destinationInventory.onHand += line.quantity;
                destinationInventory.available += line.quantity;
                await destinationInventory.save();
                console.log('Destination Inventory after update (existing):', destinationInventory);
            } else {
                const newInventoryItem = new Inventory({
                    product: line.product._id,
                    warehouse: transfer.toWarehouse,
                    onHand: line.quantity,
                    available: line.quantity
                });
                await newInventoryItem.save();
                console.log('Destination Inventory after update (new):', newInventoryItem);
            }
        }

        transfer.status = 'completed';
        transfer.validatedBy = req.user._id;
        transfer.validationDate = Date.now();
        await transfer.save();
        console.log('Transfer after validation:', transfer);

        req.flash('success_msg', 'Internal Transfer validated and inventory updated successfully');
        res.redirect('/internalTransfers/' + transfer._id);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error validating internal transfer');
        res.redirect('/internalTransfers');
    }
};