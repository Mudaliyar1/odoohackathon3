const Location = require('../models/Location');
const Warehouse = require('../models/Warehouse');

// Display list of all locations.
exports.locationList = async (req, res) => {
    try {
        const locations = await Location.find({}).populate('warehouse').sort({ name: 1 });
        res.render('locations/index', { title: 'Location List', locations });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching locations');
        res.redirect('/dashboard');
    }
};

// Display location create form on GET.
exports.locationCreateGet = async (req, res) => {
    try {
        const warehouses = await Warehouse.find({});
        res.render('locations/create', { title: 'Create Location', warehouses });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading location creation form');
        res.redirect('/locations');
    }
};

// Handle location create on POST.
exports.locationCreatePost = async (req, res) => {
    const { name, warehouse, description } = req.body;
    let errors = [];

    if (!name || !warehouse) {
        errors.push({ msg: 'Please enter all required fields' });
    }

    if (errors.length > 0) {
        const warehouses = await Warehouse.find({});
        return res.render('locations/create', {
            title: 'Create Location',
            errors,
            name,
            warehouse,
            description,
            warehouses
        });
    }

    try {
        const newLocation = new Location({
            name,
            warehouse,
            description
        });

        await newLocation.save();
        req.flash('success_msg', 'Location created successfully');
        res.redirect('/locations');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Location name already exists in this warehouse' });
        } else {
            errors.push({ msg: 'Error creating location' });
        }
        const warehouses = await Warehouse.find({});
        res.render('locations/create', {
            title: 'Create Location',
            errors,
            name,
            warehouse,
            description,
            warehouses
        });
    }
};

// Display location detail on GET.
exports.locationDetail = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id).populate('warehouse');

        if (!location) {
            req.flash('error_msg', 'Location not found');
            return res.redirect('/locations');
        }
        res.render('locations/detail', { title: 'Location Detail', location });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching location details');
        res.redirect('/locations');
    }
};

// Display location update form on GET.
exports.locationUpdateGet = async (req, res) => {
    try {
        const location = await Location.findById(req.params.id);
        const warehouses = await Warehouse.find({});

        if (!location) {
            req.flash('error_msg', 'Location not found');
            return res.redirect('/locations');
        }
        res.render('locations/edit', { title: 'Edit Location', location, warehouses });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error loading location edit form');
        res.redirect('/locations');
    }
};

// Handle location update on POST.
exports.locationUpdatePost = async (req, res) => {
    const { name, warehouse, description } = req.body;
    let errors = [];

    if (!name || !warehouse) {
        errors.push({ msg: 'Please enter all required fields' });
    }

    if (errors.length > 0) {
        const warehouses = await Warehouse.find({});
        return res.render('locations/edit', {
            title: 'Edit Location',
            errors,
            location: { _id: req.params.id, name, warehouse, description },
            warehouses
        });
    }

    try {
        const location = await Location.findById(req.params.id);
        if (!location) {
            req.flash('error_msg', 'Location not found');
            return res.redirect('/locations');
        }

        location.name = name;
        location.warehouse = warehouse;
        location.description = description;

        await location.save();
        req.flash('success_msg', 'Location updated successfully');
        res.redirect('/locations/' + location._id);
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            errors.push({ msg: 'Location name already exists in this warehouse' });
        } else {
            errors.push({ msg: 'Error updating location' });
        }
        const warehouses = await Warehouse.find({});
        res.render('locations/edit', {
            title: 'Edit Location',
            errors,
            location: { _id: req.params.id, name, warehouse, description },
            warehouses
        });
    }
};

// Handle location delete on POST.
exports.locationDelete = async (req, res) => {
    try {
        await Location.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Location deleted successfully');
        res.redirect('/locations');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting location');
        res.redirect('/locations');
    }
};