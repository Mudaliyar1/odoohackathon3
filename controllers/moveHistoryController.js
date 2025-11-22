const MoveHistory = require('../models/MoveHistory');

// Display list of all move history records.
exports.moveHistoryList = async (req, res) => {
    try {
        const moves = await MoveHistory.find({})
            .populate('product')
            .populate('fromWarehouse')
            .populate('toWarehouse')
            .populate('sourceLocation')
            .populate('destinationLocation')
            .populate('user')
            .sort({ timestamp: -1 });
        res.render('moves/index', { title: 'Move History', moves });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching move history');
        res.redirect('/dashboard');
    }
};