const Service = require('../models/Service');
const Booking = require('../models/Booking');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

exports.list = async (req, res) => {
  const filter = {};
  if (!(req.user.role === 'admin' && req.query.all === 'true')) filter.active = true;
  if (req.query.category) filter.category = String(req.query.category);
  ok(res, await Service.find(filter).sort('name'));
};
exports.get = async (req, res) => {
  const s = await Service.findById(req.params.id);
  if (!s || (!s.active && req.user.role !== 'admin')) throw new ApiError(404, 'Service not found');
  ok(res, s);
};
exports.create = async (req, res) => ok(res, await Service.create(req.body), 201, { message: 'Service created' });
exports.update = async (req, res) => {
  const s = await Service.findById(req.params.id);
  if (!s) throw new ApiError(404, 'Service not found');
  s.set(req.body); await s.save();
  ok(res, s, 200, { message: 'Service updated' });
};
exports.remove = async (req, res) => {
  const open = await Booking.countDocuments({ service: req.params.id, status: { $in: ['pending', 'confirmed'] } });
  if (open) throw new ApiError(409, 'This service has open bookings. Deactivate it or resolve the bookings first');
  const s = await Service.findByIdAndDelete(req.params.id);
  if (!s) throw new ApiError(404, 'Service not found');
  ok(res, { id: s.id }, 200, { message: 'Service deleted' });
};
