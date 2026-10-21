const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const withLock = require('../utils/mutex');
const { ok, pageParams, meta } = require('../utils/respond');

const rollback = (taken) => Promise.all(taken.map((t) => Product.updateOne({ _id: t.product }, { $inc: { stock: t.quantity } })));

// POST /api/orders – prices and stock come from the DATABASE, never from the client.
exports.create = (req, res) => withLock(() => createOrder(req, res));

async function createOrder(req, res) {
  // merge duplicate lines of the same product
  const wanted = new Map();
  for (const i of req.body.items) wanted.set(i.product, (wanted.get(i.product) || 0) + i.quantity);

  const taken = []; const items = [];
  try {
    for (const [productId, quantity] of wanted) {
      // Atomic conditional decrement: succeeds only if enough stock is left, so stock can never go below zero,
      // even with two simultaneous orders.
      const p = await Product.findOneAndUpdate(
        { _id: productId, active: true, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { returnDocument: 'after' }
      );
      if (!p) {
        const exists = await Product.findById(productId);
        if (!exists || !exists.active) throw new ApiError(404, 'A product in your cart is no longer available');
        throw new ApiError(409, `Only ${exists.stock} of "${exists.name}" left in stock`);
      }
      taken.push({ product: p._id, quantity });
      items.push({ product: p._id, name: p.name, price: p.price, quantity, lineTotal: Math.round(p.price * quantity * 100) / 100 });
    }
    const total = Math.round(items.reduce((s, i) => s + i.lineTotal, 0) * 100) / 100;
    const order = await Order.create({ user: req.user.id, items, total, shippingAddress: req.body.shippingAddress });
    ok(res, order, 201, { message: 'Demo order placed (no real payment was taken)' });
  } catch (err) {
    await rollback(taken); // give back stock reserved so far
    throw err;
  }
}

exports.mine = async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { user: req.user.id };
  const [items, total] = await Promise.all([Order.find(filter).sort('-createdAt').skip(skip).limit(limit), Order.countDocuments(filter)]);
  ok(res, items, 200, meta(page, limit, total));
};

exports.get = async (req, res) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user.id };
  const o = await Order.findOne(filter).populate('user', 'name email');
  if (!o) throw new ApiError(404, 'Order not found');
  ok(res, o);
};

// Farmer may cancel only while the order is still pending; stock is restored.
exports.cancel = (req, res) => withLock(() => cancelOrder(req, res));
async function cancelOrder(req, res) {
  const o = await Order.findOneAndUpdate({ _id: req.params.id, user: req.user.id, status: 'pending' }, { status: 'cancelled' }, { returnDocument: 'after' });
  if (!o) throw new ApiError(400, 'Only your own pending orders can be cancelled');
  await rollback(o.items);
  ok(res, o, 200, { message: 'Order cancelled' });
}

// ---- admin ----
exports.all = async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const [items, total] = await Promise.all([Order.find(filter).populate('user', 'name email').sort('-createdAt').skip(skip).limit(limit), Order.countDocuments(filter)]);
  ok(res, items, 200, meta(page, limit, total));
};

const FLOW = { pending: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [] };
exports.setStatus = async (req, res) => {
  const o = await Order.findById(req.params.id);
  if (!o) throw new ApiError(404, 'Order not found');
  const next = req.body.status;
  if (next === o.status) return ok(res, o);
  if (!FLOW[o.status].includes(next)) throw new ApiError(400, `Cannot change an order from ${o.status} to ${next}`);
  if (next === 'cancelled') await rollback(o.items);
  o.status = next; await o.save();
  ok(res, o, 200, { message: `Order marked ${next}` });
};
