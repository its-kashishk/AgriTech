const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const optText = (max) => z.string().trim().max(max).optional();
const password = z.string().min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password needs a letter').regex(/\d/, 'Password needs a number');
const phone = z.string().trim().regex(/^[0-9+\-\s]{7,20}$/, 'Enter a valid phone number');

exports.register = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password,
  phone: phone.optional(),
  location: optText(100),
  language: z.enum(['en', 'hi']).optional(),
}); // NOTE: no `role` – unknown keys are dropped, so nobody can self-register as admin.

exports.login = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

exports.profile = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  phone: phone.optional().or(z.literal('')),
  location: optText(100),
  language: z.enum(['en', 'hi']).optional(),
});

exports.changePassword = z.object({ currentPassword: z.string().min(1), newPassword: password });

const coords = z.object({ lat: z.coerce.number().min(-90).max(90), lon: z.coerce.number().min(-180).max(180) }).optional();
const farmBase = z.object({
  name: z.string().trim().min(2, 'Farm name is required').max(80),
  location: z.string().trim().min(2, 'Location is required').max(120),
  coordinates: coords,
  size: z.coerce.number().positive('Size must be greater than 0'),
  sizeUnit: z.enum(['acre', 'hectare']).optional(),
  soilType: z.enum(['alluvial', 'black', 'red', 'laterite', 'sandy', 'clay', 'loamy', 'other']).optional(),
  irrigation: z.enum(['rainfed', 'canal', 'tubewell', 'drip', 'sprinkler', 'other']).optional(),
  description: optText(500),
});
exports.farm = farmBase;
exports.farmUpdate = farmBase.partial();

const cropBase = z.object({
  farm: objectId,
  name: z.string().trim().min(2, 'Crop name is required').max(60),
  variety: optText(60),
  type: z.enum(['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'cash', 'other']).optional(),
  plot: optText(60),
  sowingDate: z.coerce.date(),
  expectedHarvestDate: z.coerce.date(),
  stage: z.enum(['sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested']).optional(),
  status: z.enum(['active', 'harvested', 'failed']).optional(),
  healthNotes: optText(1000),
});
exports.crop = cropBase;
exports.cropUpdate = cropBase.partial();

const soilBase = z.object({
  farm: objectId,
  observedAt: z.coerce.date(),
  ph: z.coerce.number().min(0).max(14).optional(),
  moisture: z.coerce.number().min(0).max(100).optional(),
  nitrogen: z.coerce.number().min(0).optional(),
  phosphorus: z.coerce.number().min(0).optional(),
  potassium: z.coerce.number().min(0).optional(),
  notes: optText(500),
});
exports.soil = soilBase;
exports.soilUpdate = soilBase.partial();

const activityBase = z.object({
  farm: objectId,
  crop: objectId.optional(),
  type: z.enum(['sowing', 'irrigation', 'fertilizing', 'pesticide', 'weeding', 'harvesting', 'other']),
  date: z.coerce.date(),
  quantity: optText(60),
  notes: optText(500),
});
exports.activity = activityBase;
exports.activityUpdate = activityBase.partial();

const productBase = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(['seed', 'fertilizer', 'pesticide', 'tool', 'equipment', 'other']),
  description: optText(800),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  unit: optText(20),
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative'),
  imageUrl: z.string().trim().url().max(400).optional().or(z.literal('')),
  active: z.boolean().optional(),
});
exports.product = productBase;
exports.productUpdate = productBase.partial();

exports.order = z.object({
  items: z.array(z.object({ product: objectId, quantity: z.coerce.number().int().min(1).max(100) })).min(1, 'Cart is empty').max(50),
  shippingAddress: z.string().trim().min(5, 'Enter a delivery address').max(300),
  paymentMethod: z.literal('demo').optional(),
});
exports.orderStatus = z.object({ status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']) });

const serviceBase = z.object({
  name: z.string().trim().min(2).max(100),
  category: z.enum(['equipment-rental', 'consultation', 'other']),
  description: optText(800),
  price: z.coerce.number().min(0),
  priceUnit: optText(30),
  slots: z.array(z.string().trim().min(3).max(30)).min(1).max(12).optional(),
  capacityPerSlot: z.coerce.number().int().min(1).max(50).optional(),
  active: z.boolean().optional(),
});
exports.service = serviceBase;
exports.serviceUpdate = serviceBase.partial();

exports.booking = z.object({
  service: objectId,
  farm: objectId.optional(),
  date: z.coerce.date(),
  slot: z.string().trim().min(3),
  notes: optText(500),
});
exports.bookingUpdate = z.object({ date: z.coerce.date().optional(), slot: z.string().trim().min(3).optional(), notes: optText(500) });
exports.bookingStatus = z.object({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'rejected']) });

exports.post = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  body: z.string().trim().min(5, 'Post must be at least 5 characters').max(3000),
  category: z.enum(['question', 'tip', 'discussion', 'pest-disease']).optional(),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(20)).max(5).optional(),
});
exports.postUpdate = exports.post.partial();
exports.comment = z.object({ body: z.string().trim().min(1, 'Comment cannot be empty').max(1000) });

exports.broadcastAlert = z.object({
  title: z.string().trim().min(3).max(120),
  message: z.string().trim().min(3).max(600),
  type: z.enum(['weather', 'harvest', 'soil', 'pest-disease', 'general']).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
});
exports.adminUserUpdate = z.object({ role: z.enum(['farmer', 'admin']).optional(), active: z.boolean().optional() });
