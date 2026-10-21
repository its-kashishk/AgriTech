const User = require('../models/User');
const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const { ok, pageParams, meta, escapeRegex } = require('../utils/respond');

// Real aggregates from the database – nothing is hard-coded.
exports.stats = async (req, res) => {
  const group = (M, field) => M.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  const [users, farmers, farms, crops, products, posts, orders, bookings, revenue, ordersByStatus, bookingsByStatus, cropsByType, lowStock] = await Promise.all([
    User.countDocuments(), User.countDocuments({ role: 'farmer' }), Farm.countDocuments(), Crop.countDocuments(), Product.countDocuments({ active: true }), Post.countDocuments(),
    Order.countDocuments(), Booking.countDocuments(),
    Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    group(Order, 'status'), group(Booking, 'status'), group(Crop, 'type'),
    Product.find({ active: true, stock: { $lte: 10 } }).sort('stock').limit(10).select('name stock unit'),
  ]);
  const pick = (rows) => rows.map((r) => ({ name: r._id, count: r.count }));
  ok(res, {
    totals: { users, farmers, farms, crops, products, posts, orders, bookings, revenue: revenue[0] ? revenue[0].total : 0 },
    ordersByStatus: pick(ordersByStatus), bookingsByStatus: pick(bookingsByStatus), cropsByType: pick(cropsByType), lowStock,
  });
};

exports.listUsers = async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = String(req.query.role);
  if (req.query.q) { const r = { $regex: escapeRegex(req.query.q), $options: 'i' }; filter.$or = [{ name: r }, { email: r }]; }
  const { page, limit, skip } = pageParams(req.query);
  const [items, total] = await Promise.all([User.find(filter).sort('-createdAt').skip(skip).limit(limit), User.countDocuments(filter)]);
  ok(res, items, 200, meta(page, limit, total));
};

exports.updateUser = async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) throw new ApiError(404, 'User not found');
  if (u.id === req.user.id) throw new ApiError(400, 'You cannot change your own role or status');
  u.set(req.body); await u.save();
  ok(res, u, 200, { message: 'User updated' });
};
