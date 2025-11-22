const Product = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Inventory = require('../models/Inventory');

// Display list of all products.
exports.productList = async (req, res) => {
    try {
        const products = await Product.find({}).populate('warehouse');
        const productsWithInventory = await Promise.all(products.map(async product => {
            const inventory = await Inventory.findOne({ product: product._id, warehouse: product.warehouse });
            return {
                ...product.toObject(),
                availableQuantity: inventory ? inventory.available : 0
            };
        }));
        res.render('products/index', { title: 'Product List', products: productsWithInventory });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching products');
        res.redirect('/dashboard');
    }
};

// Display product create form on GET.
exports.productCreateGet = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({});
        res.render('products/create', { title: 'Create Product', warehouses });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching warehouses');
        res.redirect('/products');
    }
};

// Handle product create on POST.
exports.productCreatePost = async (req, res) => {
    const { name, sku, category, unitOfMeasure, reorderLevel, price, quantity, warehouse } = req.body;
    let errors = [];

    if (!name || !category || !unitOfMeasure || reorderLevel === undefined || !price || quantity === undefined || !warehouse) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (errors.length > 0) {
        const warehouses = await Warehouse.find({});
        res.render('products/create', {
            title: 'Create Product',
            errors,
            name,
            sku,
            category,
            unitOfMeasure,
            reorderLevel,
            price,
            quantity,
            warehouseId: warehouse,
            warehouses
        });
    } else {
        try {
            // Auto-generate SKU if not provided
            let generatedSku = sku;
            if (!sku || sku.trim() === '') {
                // Generate SKU based on product name and timestamp
                const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
                const timestamp = Date.now().toString().slice(-6);
                generatedSku = `${prefix}${timestamp}`;
                
                // Ensure SKU is unique
                let skuExists = await Product.findOne({ sku: generatedSku });
                let counter = 1;
                while (skuExists) {
                    generatedSku = `${prefix}${timestamp}${counter}`;
                    skuExists = await Product.findOne({ sku: generatedSku });
                    counter++;
                }
            }

            const newProduct = new Product({
                name,
                sku: generatedSku,
                category,
                unitOfMeasure,
                reorderLevel,
                price,
                quantity: parseInt(quantity) || 0,
                warehouse
            });

            await newProduct.save();
            req.flash('success_msg', 'Product added successfully');
            res.redirect('/products');
        } catch (err) {
            console.error(err);
            if (err.code === 11000) {
                if (err.keyPattern.name) {
                    errors.push({ msg: 'Product name already exists' });
                } else if (err.keyPattern.sku) {
                    errors.push({ msg: 'SKU already exists' });
                } else {
                    errors.push({ msg: 'Product with these details already exists' });
                }
            } else {
                errors.push({ msg: 'Error creating product' });
            }
            const warehouses = await Warehouse.find({});
            res.render('products/create', {
                title: 'Create Product',
                errors,
                name,
                sku,
                category,
                unitOfMeasure,
                reorderLevel,
                price,
                quantity,
                warehouseId: warehouse,
                warehouses
            });
        }
    }
};

// Display product detail on GET.
exports.productDetail = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('warehouse');
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/products');
        }
        res.render('products/detail', { title: 'Product Detail', product });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching product details');
        res.redirect('/products');
    }
};

// Display product update form on GET.
exports.productUpdateGet = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('warehouse');
        const warehouses = await Warehouse.find({});
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/products');
        }
        res.render('products/edit', { title: 'Edit Product', product, warehouses });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching product for edit');
        res.redirect('/products');
    }
};

// Handle product update on POST.
exports.productUpdatePost = async (req, res) => {
    const { name, sku, category, unitOfMeasure, reorderLevel, price, quantity, warehouse } = req.body;
    let errors = [];

    if (!name || !sku || !category || !unitOfMeasure || reorderLevel === undefined || !price || quantity === undefined || !warehouse) {
        errors.push({ msg: 'Please enter all fields' });
    }

    if (errors.length > 0) {
        const warehouses = await Warehouse.find({});
        const product = await Product.findById(req.params.id).populate('warehouse');
        res.render('products/edit', {
            title: 'Edit Product',
            errors,
            product: { _id: req.params.id, name, sku, category, unitOfMeasure, reorderLevel, price, quantity, warehouse: product.warehouse },
            warehouses
        });
    } else {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                req.flash('error_msg', 'Product not found');
                return res.redirect('/products');
            }

            product.name = name;
            product.sku = sku;
            product.category = category;
            product.unitOfMeasure = unitOfMeasure;
            product.reorderLevel = reorderLevel;
            product.price = price;
            product.quantity = parseInt(quantity) || 0;
            product.warehouse = warehouse;

            await product.save();
            req.flash('success_msg', 'Product updated successfully');
            res.redirect('/products/' + req.params.id);
        } catch (err) {
            console.error(err);
            if (err.code === 11000) {
                errors.push({ msg: 'SKU already exists' });
            } else {
                errors.push({ msg: 'Error updating product' });
            }
            const warehouses = await Warehouse.find({});
            const product = await Product.findById(req.params.id).populate('warehouse');
            res.render('products/edit', {
                title: 'Edit Product',
                errors,
                product: { _id: req.params.id, name, sku, category, unitOfMeasure, reorderLevel, price, quantity, warehouse: product.warehouse },
                warehouses
            });
        }
    }
};

// Handle product delete on POST.
exports.productDelete = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/products');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting product');
        res.redirect('/products');
    }
};