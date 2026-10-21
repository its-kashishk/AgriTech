const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Farm = require('../models/Farm');
const ApiError = require('../utils/ApiError');
const { ok, pageParams, meta } = require('../utils/respond');

const ACTIVE = ['pending', 'confirmed'];
const dayStart = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
const todayStart = () => dayStart(new Date());

/*
 * Simplified availability model: a (service, date, slot) can hold at most `capacityPerSlot` ACTIVE
 * bookings (pending/confirmed). Cancelled/rejected/completed bookings do not block a slot.
 */
async function checkSlot(service, date, slot, ignoreId) {
  if (!service.active) throw new ApiError(400, 'This service is not available for booking');
  if (!service.slots.includes(slot)) throw new ApiError(400, `Choose one of the available time slots: ${service.slots.join(', ')}`);
  if (date < todayStart()) throw new ApiError(400, 'Booking date cannot be in the past');
  const filter = { service: service._id, date, slot, status: { $in: ACTIVE } };
  if (ignoreId) filter._id = { $ne: ignoreId };
  if ((await Booking.countDocuments(filter)) >= service.capacityPerSlot) throw new ApiError(409, 'That slot is already full. Please pick another date or time');
}

exports.create = async (req, res) => {
  const service = await Service.findById(req.body.service);
  if (!service) throw new ApiError(404, 'Service not found');
  if (req.body.farm && !(await Farm.findOne({ _id: req.body.farm, owner: req.user.id }))) throw new ApiError(404, 'Farm not found');
  const date = dayStart(req.body.date);
  await checkSlot(service, date, req.body.slot);
  const b = await Booking.create({ ...req.body, date, user: req.user.id, price: service.price });
  ok(res, b, 201, { message: 'Booking requested. You will see its status here' });
};

exports.mine = async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { user: req.user.id };
  if (req.query.status) filter.status = String(req.query.status);
  const [items, total] = await Promise.all([
    Booking.find(filter).populate('service', 'name category slots').populate('farm', 'name').sort('-date').skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  ok(res, items, 200, meta(page, limit, total));
};

exports.get = async (req, res) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user: req.user.id };
  const b = await Booking.findOne(filter).populate('service').populate('user', 'name email');
  if (!b) throw new ApiError(404, 'Booking not found');
  ok(res, b);
};

// Farmer can reschedule or edit notes only while the booking is still PENDING.
exports.update = async (req, res) => {
  const b = await Booking.findOne({ _id: req.params.id, user: req.user.id });
  if (!b) throw new ApiError(404, 'Booking not found');
  if (b.status !== 'pending') throw new ApiError(400, 'Only pending bookings can be changed. Cancel and rebook instead');
  const service = await Service.findById(b.service);
  const date = req.body.date ? dayStart(req.body.date) : b.date;
  const slot = req.body.slot || b.slot;
  await checkSlot(service, date, slot, b._id);
  b.set({ date, slot, ...(req.body.notes !== undefined ? { notes: req.body.notes } : {}) });
  await b.save();
  ok(res, b, 200, { message: 'Booking updated' });
};

// Farmer can cancel while pending or confirmed.
exports.cancel = async (req, res) => {
  const b = await Booking.findOneAndUpdate({ _id: req.params.id, user: req.user.id, status: { $in: ACTIVE } }, { status: 'cancelled' }, { returnDocument: 'after' });
  if (!b) throw new ApiError(400, 'Only your pending or confirmed bookings can be cancelled');
  ok(res, b, 200, { message: 'Booking cancelled' });
};

// ---- admin ----
exports.all = async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = req.query.status ? { status: String(req.query.status) } : {};
  const [items, total] = await Promise.all([
    Booking.find(filter).populate('service', 'name category').populate('user', 'name email').sort('-createdAt').skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  ok(res, items, 200, meta(page, limit, total));
};

const FLOW = { pending: ['confirmed', 'rejected', 'cancelled'], confirmed: ['completed', 'cancelled'], completed: [], cancelled: [], rejected: [] };
exports.setStatus = async (req, res) => {
  const b = await Booking.findById(req.params.id);
  if (!b) throw new ApiError(404, 'Booking not found');
  if (b.status !== req.body.status && !FLOW[b.status].includes(req.body.status)) throw new ApiError(400, `Cannot change a booking from ${b.status} to ${req.body.status}`);
  b.status = req.body.status; await b.save();
  ok(res, b, 200, { message: `Booking marked ${b.status}` });
};
