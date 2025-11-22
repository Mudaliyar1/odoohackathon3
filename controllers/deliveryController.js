const Delivery = require('../models/Delivery');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const { generatePdf } = require('../services/pdfService');
const path = require('path');
const ejs = require('ejs');

// Display list of all deliveries.
exports.deliveryList = async (req, res) => {
    try {
        const deliveries = await Delivery.find({}).populate('warehouse').populate('createdBy').sort({ createdAt: -1 });
        res.render('deliveries/index', { title: 'Delivery List', deliveries });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching deliveries');
        res.redirect('/dashboard');
    }
};

// Display delivery create form on GET.
exports.deliveryCreateGet = async (req, res) => {
    try {
        const products = await Product.find({});
        const warehouses = await Warehouse.find({});
        
        // Fetch inventory data for all products in all warehouses
        const inventoryData = await Inventory.find({})
            .populate('product')
            .populate('warehouse')
            .lean();
        
        // Create a map of product-warehouse inventory
        const inventoryMap = {};
        inventoryData.forEach(item => {
            // Skip items with null product or warehouse references
            if (!item.product || !item.warehouse) {
                console.log('Skipping inventory item with null product or warehouse:', item);
                return;
            }
            const key = `${item.product._id}-${item.warehouse._id}`;
            inventoryMap[key] = {
                available: item.available,
                onHand: item.onHand
            };
            console.log(`Inventory for product ${item.product._id} in warehouse ${item.warehouse._id}: Available=${item.available}, OnHand=${item.onHand}`);
        });
        
        // Auto-generate document number
        const lastDelivery = await Delivery.findOne().sort({ documentNumber: -1 });
        let newDocumentNumber = '1';
        if (lastDelivery && lastDelivery.documentNumber) {
            const lastNumber = parseInt(lastDelivery.documentNumber, 10);
            newDocumentNumber = (lastNumber + 1).toString();
        }
        
        res.render('deliveries/create', { 
            title: 'Create Delivery', 
            products, 
            warehouses, 
            documentNumber: newDocumentNumber,
            inventoryMap: JSON.stringify(inventoryMap)
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading delivery creation form');
        res.redirect('/deliveries');
    }
};

// Handle delivery delete on POST.
exports.deliveryDeletePost = async (req, res) => {
    try {
        await Delivery.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Delivery deleted successfully');
        res.redirect('/deliveries');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting delivery');
        res.redirect('/deliveries');
    }
};

// Handle delivery PDF download.
exports.deliveryDownloadPdf = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('warehouse')
            .populate('lines.product')
            .populate('createdBy');

        if (!delivery) {
            req.flash('error_msg', 'Delivery not found');
            return res.redirect('/deliveries');
        }

        const templatePath = path.join(__dirname, '../views/deliveries/detail.ejs');
        const html = await ejs.renderFile(templatePath, { delivery, moment: require('moment') });
        console.log('Generated HTML:', html); // Log the generated HTML
        const pdfBuffer = await generatePdf(templatePath, { delivery, moment: require('moment') });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="delivery-${delivery.documentNumber}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error generating PDF for delivery');
        res.redirect('/deliveries');
    }
};

// Handle delivery create on POST.
exports.deliveryCreatePost = async (req, res) => {
    const { documentNumber, customerName, warehouse } = req.body;
    let products = req.body.products;
    let errors = [];

    // Ensure products is an array
    if (!Array.isArray(products)) {
        products = [products];
    }

    // Filter out empty products
    products = products.filter(p => p && p.id && p.quantity && p.unitPrice);

    if (!documentNumber || !customerName || !warehouse || !products || products.length === 0) {
        errors.push({ msg: 'Please enter all required fields and at least one product' });
    }

    if (errors.length > 0) {
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        
        // Fetch inventory data for error case
        const inventoryData = await Inventory.find({})
            .populate('product')
            .populate('warehouse')
            .lean();
        
        const inventoryMap = {};
        inventoryData.forEach(item => {
            const key = `${item.product._id}-${item.warehouse._id}`;
            inventoryMap[key] = {
                available: item.available,
                onHand: item.onHand
            };
        });
        
        return res.render('deliveries/create', {
            title: 'Create Delivery',
            errors,
            documentNumber,
            customerName,
            warehouse,
            products: allProducts,
            warehouses: allWarehouses,
            inventoryMap: JSON.stringify(inventoryMap)
        });
    }

    console.log('req.body:', req.body);
    console.log('Products array:', products);

    try {
        // First, check if we have enough inventory for all products
        for (const product of products) {
            const inventoryItem = await Inventory.findOne({
                product: product.id,
                warehouse: warehouse
            });
            console.log('Inventory Item during creation check:', inventoryItem);

            if (!inventoryItem || inventoryItem.available < parseInt(product.quantity)) {
                errors.push({ msg: `Not enough stock for product ${product.id}. Available: ${inventoryItem ? inventoryItem.available : 0}, Requested: ${product.quantity}` });
            }
        }

        if (errors.length > 0) {
            const allProducts = await Product.find({});
            const allWarehouses = await Warehouse.find({});
            
            // Fetch inventory data for error case
            const inventoryData = await Inventory.find({})
                .populate('product')
                .populate('warehouse')
                .lean();
            
            const inventoryMap = {};
            inventoryData.forEach(item => {
                const key = `${item.product._id}-${item.warehouse._id}`;
                inventoryMap[key] = {
                    available: item.available,
                    onHand: item.onHand
                };
            });
            
            return res.render('deliveries/create', {
                title: 'Create Delivery',
                errors,
                documentNumber,
                customerName,
                warehouse,
                products: allProducts,
                warehouses: allWarehouses,
                inventoryMap: JSON.stringify(inventoryMap)
            });
        }

        // Reserve inventory for all products
        for (const product of products) {
            const inventoryItem = await Inventory.findOne({
                product: product.id,
                warehouse: warehouse
            });

            if (inventoryItem) {
                console.log('Inventory Item before reservation:', inventoryItem);
                // Reserve the quantity (decrease available but keep onHand the same)
                inventoryItem.reserved += parseInt(product.quantity);
                inventoryItem.available -= parseInt(product.quantity);
                await inventoryItem.save();
                console.log('Inventory Item after reservation:', inventoryItem);
            }
        }

        const newDelivery = new Delivery({
            documentNumber,
            customerName,
            warehouse,
            lines: products.map(p => ({ 
                product: p.id, 
                quantity: parseInt(p.quantity), 
                unitPrice: parseFloat(p.unitPrice) 
            })),
            createdBy: req.user._id
        });

        await newDelivery.save();
        req.flash('success_msg', 'Delivery created successfully and inventory reserved');
        res.redirect('/deliveries');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Document Number already exists' });
        } else {
            errors.push({ msg: 'Error creating delivery' });
        }
        
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        
        // Fetch inventory data for error case
        const inventoryData = await Inventory.find({})
            .populate('product')
            .populate('warehouse')
            .lean();
        
        const inventoryMap = {};
        inventoryData.forEach(item => {
            // Skip items with null product or warehouse references
            if (!item.product || !item.warehouse) {
                console.log('Skipping inventory item with null product or warehouse:', item);
                return;
            }
            const key = `${item.product._id}-${item.warehouse._id}`;
            inventoryMap[key] = {
                available: item.available,
                onHand: item.onHand
            };
        });
        
        res.render('deliveries/create', {
            title: 'Create Delivery',
            errors,
            documentNumber,
            customerName,
            warehouse,
            products: allProducts,
            warehouses: allWarehouses,
            inventoryMap: JSON.stringify(inventoryMap)
        });
    }
};

// Display delivery detail on GET.
exports.deliveryDetail = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id)
            .populate('warehouse')
            .populate('createdBy')
            .populate('validatedBy')
            .populate('lines.product');

        if (!delivery) {
            req.flash('error_msg', 'Delivery not found');
            return res.redirect('/deliveries');
        }
        res.render('deliveries/detail', { title: 'Delivery Detail', delivery });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching delivery details');
        res.redirect('/deliveries');
    }
};

// Handle delivery validation on POST.
exports.deliveryValidate = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id).populate('lines.product');
        console.log('Delivery before validation:', delivery);

        if (!delivery) {
            req.flash('error_msg', 'Delivery not found');
            return res.redirect('/deliveries');
        }

        if (delivery.status !== 'pending') {
            req.flash('error_msg', 'Delivery already processed.');
            return res.redirect('/deliveries/' + delivery._id);
        }

        // Update inventory for each product in the delivery
        for (const line of delivery.lines) {
            let inventoryItem = await Inventory.findOne({ product: line.product._id, warehouse: delivery.warehouse });
            console.log('Inventory Item before update:', inventoryItem);

            if (!inventoryItem) {
                req.flash('error_msg', `No inventory found for ${line.product.name}.`);
                return res.redirect('/deliveries/' + delivery._id);
            }

            // Check if we have enough reserved quantity
            if (inventoryItem.reserved < line.quantity) {
                req.flash('error_msg', `Not enough reserved ${line.product.name} for this delivery. Reserved: ${inventoryItem.reserved}, Required: ${line.quantity}`);
                return res.redirect('/deliveries/' + delivery._id);
            }

            // Decrement both onHand and reserved (since we're delivering the reserved items)
            inventoryItem.onHand -= line.quantity;
            inventoryItem.reserved -= line.quantity;
            // available should already be correct from the reservation
            await inventoryItem.save();
            console.log('Inventory Item after update:', inventoryItem);

            // **DEDUCT FROM PRODUCT QUANTITY**
            const product = await Product.findById(line.product._id);
            if (product) {
                console.log(`Product ${product.name} quantity before deduction: ${product.quantity}`);
                product.quantity -= line.quantity;
                await product.save();
                console.log(`Product ${product.name} quantity after deduction: ${product.quantity}`);
            } else {
                console.log(`Product not found for ID: ${line.product._id}`);
            }
        }

        delivery.status = 'delivered';
        delivery.validatedBy = req.user._id;
        delivery.validationDate = Date.now();
        await delivery.save();
        console.log('Delivery after validation:', delivery);

        req.flash('success_msg', 'Delivery validated and inventory updated successfully');
        res.redirect('/deliveries/' + delivery._id);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error validating delivery');
        res.redirect('/deliveries');
    }
};