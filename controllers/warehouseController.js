const Warehouse = require('../models/Warehouse');

// Display list of all warehouses.
exports.warehouseList = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({}).sort({ name: 1 });
        res.render('warehouses/index', { title: 'Warehouse List', warehouses });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching warehouses');
        res.redirect('/dashboard');
    }
};

// Display warehouse create form on GET.
exports.warehouseCreateGet = (req, res) => {
    res.render('warehouses/create', { title: 'Create Warehouse' });
};

// Handle warehouse create on POST.
exports.warehouseCreatePost = async (req, res) => {
    const { name, location, description } = req.body;
    let errors = [];

    if (!name || !location) {
        errors.push({ msg: 'Please enter all required fields' });
    }

    if (errors.length > 0) {
        return res.render('warehouses/create', {
            title: 'Create Warehouse',
            errors,
            name,
            location,
            description
        });
    }

    try {
        const newWarehouse = new Warehouse({
            name,
            location,
            description
        });

        await newWarehouse.save();
        req.flash('success_msg', 'Warehouse created successfully');
        res.redirect('/warehouses');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Warehouse name already exists' });
        } else {
            errors.push({ msg: 'Error creating warehouse' });
        }
        res.render('warehouses/create', {
            title: 'Create Warehouse',
            errors,
            name,
            location,
            description
        });
    }
};

// Display warehouse detail on GET.
exports.warehouseDetail = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            req.flash('error_msg', 'Warehouse not found');
            return res.redirect('/warehouses');
        }
        res.render('warehouses/detail', { title: 'Warehouse Detail', warehouse });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching warehouse details');
        res.redirect('/warehouses');
    }
};

// Display warehouse update form on GET.
exports.warehouseUpdateGet = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);

        if (!warehouse) {
            req.flash('error_msg', 'Warehouse not found');
            return res.redirect('/warehouses');
        }
        res.render('warehouses/edit', { title: 'Edit Warehouse', warehouse });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading warehouse edit form');
        res.redirect('/warehouses');
    }
};

// Handle warehouse update on POST.
exports.warehouseUpdatePost = async (req, res) => {
    const { name, location, description } = req.body;
    let errors = [];

    if (!name || !location) {
        errors.push({ msg: 'Please enter all required fields' });
    }

    if (errors.length > 0) {
        return res.render('warehouses/edit', {
            title: 'Edit Warehouse',
            errors,
            warehouse: { _id: req.params.id, name, location, description }
        });
    }

    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            req.flash('error_msg', 'Warehouse not found');
            return res.redirect('/warehouses');
        }

        warehouse.name = name;
        warehouse.location = location;
        warehouse.description = description;

        await warehouse.save();
        req.flash('success_msg', 'Warehouse updated successfully');
        res.redirect('/warehouses/' + warehouse._id);
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Warehouse name already exists' });
        } else {
            errors.push({ msg: 'Error updating warehouse' });
        }
        res.render('warehouses/edit', {
            title: 'Edit Warehouse',
            errors,
            warehouse: { _id: req.params.id, name, location, description }
        });
    }
};

// Handle warehouse delete on POST.
exports.warehouseDelete = async (req, res) => {
    try {
        await Warehouse.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Warehouse deleted successfully');
        res.redirect('/warehouses');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting warehouse');
        res.redirect('/warehouses');
    }
};