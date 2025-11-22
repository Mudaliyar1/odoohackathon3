const Receipt = require('../models/Receipt');
const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');
const { generatePdf } = require('../services/pdfService');
const path = require('path');

// Display list of all receipts.
exports.receiptList = async (req, res) => {
    try {
        const receipts = await Receipt.find({}).populate('warehouse').populate('createdBy').sort({ createdAt: -1 });
        res.render('receipts/index', { title: 'Receipt List', receipts });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching receipts');
        res.redirect('/dashboard');
    }
};

// Display receipt create form on GET.
exports.receiptCreateGet = async (req, res) => {
    try {
        const products = await Product.find({});
        const warehouses = await Warehouse.find({});
        
        // Auto-generate document number
        const lastReceipt = await Receipt.findOne().sort({ documentNumber: -1 });
        let newDocumentNumber = '1';
        if (lastReceipt && lastReceipt.documentNumber) {
            const lastNumber = parseInt(lastReceipt.documentNumber, 10);
            newDocumentNumber = (lastNumber + 1).toString();
        }
        
        res.render('receipts/create', { 
            title: 'Create Receipt', 
            products, 
            warehouses,
            documentNumber: newDocumentNumber
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading receipt creation form');
        res.redirect('/receipts');
    }
};

// Handle receipt delete on POST.
exports.receiptDeletePost = async (req, res) => {
    try {
        await Receipt.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Receipt deleted successfully');
        res.redirect('/receipts');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting receipt');
        res.redirect('/receipts');
    }
};

// Handle receipt PDF download.
exports.receiptDownloadPdf = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id)
            .populate('warehouse')
            .populate('lines.product')
            .populate('createdBy');

        if (!receipt) {
            req.flash('error_msg', 'Receipt not found');
            return res.redirect('/receipts');
        }

        const templatePath = path.join(__dirname, '../views/receipts/detail.ejs');
        const pdfBuffer = await generatePdf(templatePath, { receipt, moment: require('moment') });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="receipt-${receipt.documentNumber}.pdf"`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error generating PDF for receipt');
        res.redirect('/receipts');
    }
};

// Handle receipt create on POST.
exports.receiptCreatePost = async (req, res) => {
    const { documentNumber, supplierName, warehouse, products } = req.body;
    let errors = [];

    if (!documentNumber || !supplierName || !warehouse || !products || products.length === 0) {
        errors.push({ msg: 'Please enter all required fields and at least one product' });
    }

    if (errors.length > 0) {
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        return res.render('receipts/create', {
            title: 'Create Receipt',
            errors,
            documentNumber,
            supplierName,
            warehouse,
            products: allProducts,
            warehouses: allWarehouses
        });
    }

    try {
        // Auto-generate document number if not provided or duplicate
        let generatedDocumentNumber = documentNumber;
        if (!documentNumber || documentNumber.trim() === '') {
            // Find the last receipt and increment the document number
            const lastReceipt = await Receipt.findOne().sort({ documentNumber: -1 });
            const lastNumber = lastReceipt ? parseInt(lastReceipt.documentNumber) : 0;
            generatedDocumentNumber = (lastNumber + 1).toString();
        }

        // Check if document number already exists
        const existingReceipt = await Receipt.findOne({ documentNumber: generatedDocumentNumber });
        if (existingReceipt) {
            // Find the highest document number and increment it
            const highestReceipt = await Receipt.findOne().sort({ documentNumber: -1 });
            const highestNumber = parseInt(highestReceipt.documentNumber);
            generatedDocumentNumber = (highestNumber + 1).toString();
        }

        // Process products - handle both existing and new products
        const processedProducts = [];
        
        for (let i = 0; i < products.length; i++) {
            const productData = products[i];
            
            // Check if this is a new product or existing product
            if (productData.newName) {
                // Auto-generate SKU for new product if not provided
                let newSku = productData.newSku;
                if (!newSku || newSku.trim() === '') {
                    const prefix = productData.newName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
                    const timestamp = Date.now().toString().slice(-6);
                    newSku = `${prefix}${timestamp}`;
                    
                    // Ensure SKU is unique
                    let skuExists = await Product.findOne({ sku: newSku });
                    let counter = 1;
                    while (skuExists) {
                        newSku = `${prefix}${timestamp}${counter}`;
                        skuExists = await Product.findOne({ sku: newSku });
                        counter++;
                    }
                }

                // Create new product
                const newProduct = new Product({
                    name: productData.newName,
                    sku: newSku,
                    category: productData.newCategory,
                    unitOfMeasure: productData.newUnitOfMeasure,
                    price: productData.unitPrice,
                    reorderLevel: productData.newReorderLevel || 1,
                    quantity: 0 // Will be updated when receipt is validated
                });
                
                await newProduct.save();
                processedProducts.push({
                    product: newProduct._id,
                    quantity: productData.quantity,
                    unitPrice: productData.unitPrice
                });
                
                console.log(`New product created: ${newProduct.name} (${newProduct.sku})`);
            } else {
                // Use existing product
                processedProducts.push({
                    product: productData.id,
                    quantity: productData.quantity,
                    unitPrice: productData.unitPrice
                });
            }
        }

        const newReceipt = new Receipt({
            documentNumber: generatedDocumentNumber,
            supplierName,
            warehouse,
            lines: processedProducts,
            createdBy: req.user._id
        });

        await newReceipt.save();
        req.flash('success_msg', 'Receipt created successfully');
        res.redirect('/receipts');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Document Number already exists' });
        } else {
            errors.push({ msg: 'Error creating receipt' });
        }
        const allProducts = await Product.find({});
        const allWarehouses = await Warehouse.find({});
        res.render('receipts/create', {
            title: 'Create Receipt',
            errors,
            documentNumber,
            supplierName,
            warehouse,
            products: allProducts,
            warehouses: allWarehouses
        });
    }
};

// Display receipt detail on GET.
exports.receiptDetail = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id)
            .populate('warehouse')
            .populate('createdBy')
            .populate('validatedBy')
            .populate('lines.product');

        if (!receipt) {
            req.flash('error_msg', 'Receipt not found');
            return res.redirect('/receipts');
        }
        res.render('receipts/detail', { title: 'Receipt Detail', receipt });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching receipt details');
        res.redirect('/receipts');
    }
};

// Handle receipt validation on POST.
exports.receiptValidate = async (req, res) => {
    try {
        const receipt = await Receipt.findById(req.params.id).populate('lines.product');

        if (!receipt) {
            req.flash('error_msg', 'Receipt not found');
            return res.redirect('/receipts');
        }

        if (receipt.status !== 'pending') {
            req.flash('error_msg', 'Receipt already processed.');
            return res.redirect('/receipts/' + receipt._id);
        }

        // Update inventory for each product in the receipt
        for (const line of receipt.lines) {
            console.log(`Checking inventory for product: ${line.product._id} in warehouse: ${receipt.warehouse}`);
            let inventoryItem = await Inventory.findOne({ product: line.product._id, warehouse: receipt.warehouse });

            if (inventoryItem) {
                console.log(`Inventory Item found. Before update: onHand=${inventoryItem.onHand}, available=${inventoryItem.available}`);
                inventoryItem.onHand += line.quantity;
                inventoryItem.available += line.quantity;
                await inventoryItem.save();
                console.log(`Inventory Item updated. After update: onHand=${inventoryItem.onHand}, available=${inventoryItem.available}`);
            } else {
                console.log(`No Inventory Item found. Creating new one for product: ${line.product._id}`);
                const newInventoryItem = new Inventory({
                    product: line.product._id,
                    warehouse: receipt.warehouse,
                    onHand: line.quantity,
                    available: line.quantity
                });
                await newInventoryItem.save();
                console.log(`New Inventory Item created: onHand=${newInventoryItem.onHand}, available=${newInventoryItem.available}`);
            }

            // Update product's total quantity
            const product = await Product.findById(line.product._id);
            if (product) {
                console.log(`Product ${product.name} quantity before update: ${product.quantity}`);
                product.quantity += line.quantity;
                await product.save();
                console.log(`Product ${product.name} quantity after update: ${product.quantity}`);
            }
        }

        receipt.status = 'received';
        receipt.validatedBy = req.user._id;
        receipt.validationDate = Date.now();
        await receipt.save();

        req.flash('success_msg', 'Receipt validated and inventory updated successfully');
        res.redirect('/receipts/' + receipt._id);
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error validating receipt');
        res.redirect('/receipts');
    }
};