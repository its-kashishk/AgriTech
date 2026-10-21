const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const FarmActivity = require('../models/FarmActivity');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Alert = require('../models/Alert');
const { ok } = require('../utils/respond');

// Farmer dashboard – every number is computed from this user's own records.
exports.farmer = async (req, res) => {
  const owner = req.user.id;
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 864e5);
  const [farms, activeCrops, upcomingHarvests, recentActivities, recentOrders, upcomingBookings, unreadAlerts, byStage] = await Promise.all([
    Farm.countDocuments({ owner }),
    Crop.countDocuments({ owner, status: 'active' }),
    Crop.find({ owner, status: 'active', expectedHarvestDate: { $lte: soon } }).sort('expectedHarvestDate').limit(5).populate('farm', 'name'),
    FarmActivity.find({ owner }).sort('-date').limit(5).populate('farm', 'name'),
    Order.find({ user: owner }).sort('-createdAt').limit(3),
    Booking.find({ user: owner, status: { $in: ['pending', 'confirmed'] }, date: { $gte: new Date(now.toDateString()) } }).sort('date').limit(3).populate('service', 'name'),
    Alert.countDocuments({ $or: [{ user: owner, read: false }, { user: null }] }),
    Crop.aggregate([{ $match: { owner: req.user._id, status: 'active' } }, { $group: { _id: '$stage', count: { $sum: 1 } } }]),
  ]);
  ok(res, { counts: { farms, activeCrops, unreadAlerts }, upcomingHarvests, recentActivities, recentOrders, upcomingBookings, cropsByStage: byStage.map((r) => ({ name: r._id, count: r.count })) });
};
