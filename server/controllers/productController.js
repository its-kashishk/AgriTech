const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { ok, pageParams, meta, escapeRegex } = require('../utils/respond');

exports.list = async (req, res) => {
  const filter = { active: true };
  if (req.user && req.user.role === 'admin' && req.query.all === 'true') delete filter.active;
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.q) filter.name = { $regex: escapeRegex(req.query.q), $options: 'i' };
  if (req.query.inStock === 'true') filter.stock = { $gt: 0 };
  const { page, limit, skip } = pageParams(req.query);
  const [items, total] = await Promise.all([Product.find(filter).sort('name').skip(skip).limit(limit), Product.countDocuments(filter)]);
  ok(res, items, 200, meta(page, limit, total));
};
exports.get = async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p || (!p.active && req.user.role !== 'admin')) throw new ApiError(404, 'Product not found');
  ok(res, p);
};
exports.create = async (req, res) => ok(res, await Product.create(req.body), 201, { message: 'Product created' });
exports.update = async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  p.set(req.body); await p.save();
  ok(res, p, 200, { message: 'Product updated' });
};
// Soft delete keeps order history intact.
exports.remove = async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, { active: false }, { returnDocument: 'after' });
  if (!p) throw new ApiError(404, 'Product not found');
  ok(res, p, 200, { message: 'Product removed from the shop (history kept)' });
};
