const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, authorize } = require('../middleware/auth');
const { validate, validId } = require('../middleware/validate');
const S = require('../validators/schemas');

const auth = require('../controllers/authController');
const farms = require('../controllers/farmController');
const crops = require('../controllers/cropController');
const activities = require('../controllers/activityController');
const soil = require('../controllers/soilController');
const cropInfo = require('../controllers/cropInfoController');
const weather = require('../controllers/weatherController');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');
const services = require('../controllers/serviceController');
const bookings = require('../controllers/bookingController');
const community = require('../controllers/communityController');
const alerts = require('../controllers/alertController');
const admin = require('../controllers/adminController');
const dashboard = require('../controllers/dashboardController');

const router = express.Router();
const off = process.env.NODE_ENV === 'test';
const limiter = (windowMs, max, message) => rateLimit({ windowMs, limit: off ? 100000 : max, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });
const authLimiter = limiter(15 * 60 * 1000, 30, 'Too many attempts. Please try again in 15 minutes');
const weatherLimiter = limiter(60 * 1000, 30, 'Too many weather requests. Please slow down');

for (const p of ['id', 'commentId']) router.param(p, validId);

// ---- public ----
router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } }));
router.post('/auth/register', authLimiter, validate(S.register), auth.register);
router.post('/auth/login', authLimiter, validate(S.login), auth.login);

// everything below needs a valid token
router.use(protect);
const adminOnly = authorize('admin');

// ---- auth / profile ----
router.get('/auth/me', auth.me);
router.put('/users/me', validate(S.profile), auth.updateProfile);
router.put('/users/me/password', authLimiter, validate(S.changePassword), auth.changePassword);

// ---- farmer data (owner-scoped) ----
const mountOwned = (path, ctrl, create, update) => {
  router.route(path).get(ctrl.list).post(validate(create), ctrl.create);
  router.route(`${path}/:id`).get(ctrl.get).put(validate(update), ctrl.update).delete(ctrl.remove);
};
mountOwned('/farms', farms, S.farm, S.farmUpdate);
mountOwned('/crops', crops, S.crop, S.cropUpdate);
mountOwned('/activities', activities, S.activity, S.activityUpdate);
mountOwned('/soil', soil, S.soil, S.soilUpdate);
router.get('/soil/:id/guidance', soil.guidance);
router.get('/dashboard', dashboard.farmer);

// ---- reference + weather ----
router.get('/crop-info', cropInfo.list);
router.get('/crop-info/pests', cropInfo.pests);
router.get('/crop-info/:slug', cropInfo.get);
router.get('/weather', weatherLimiter, weather.get);

// ---- marketplace ----
router.get('/products', products.list);
router.get('/products/:id', products.get);
router.post('/products', adminOnly, validate(S.product), products.create);
router.put('/products/:id', adminOnly, validate(S.productUpdate), products.update);
router.delete('/products/:id', adminOnly, products.remove);

router.post('/orders', validate(S.order), orders.create);
router.get('/orders', orders.mine);
router.get('/orders/admin/all', adminOnly, orders.all);
router.get('/orders/:id', orders.get);
router.put('/orders/:id/cancel', orders.cancel);
router.put('/orders/:id/status', adminOnly, validate(S.orderStatus), orders.setStatus);

// ---- services & bookings ----
router.get('/services', services.list);
router.get('/services/:id', services.get);
router.post('/services', adminOnly, validate(S.service), services.create);
router.put('/services/:id', adminOnly, validate(S.serviceUpdate), services.update);
router.delete('/services/:id', adminOnly, services.remove);

router.post('/bookings', validate(S.booking), bookings.create);
router.get('/bookings', bookings.mine);
router.get('/bookings/admin/all', adminOnly, bookings.all);
router.get('/bookings/:id', bookings.get);
router.put('/bookings/:id', validate(S.bookingUpdate), bookings.update);
router.put('/bookings/:id/cancel', bookings.cancel);
router.put('/bookings/:id/status', adminOnly, validate(S.bookingStatus), bookings.setStatus);

// ---- community ----
router.get('/community', community.list);
router.post('/community', validate(S.post), community.create);
router.get('/community/:id', community.get);
router.put('/community/:id', validate(S.postUpdate), community.update);
router.delete('/community/:id', community.remove);
router.post('/community/:id/comments', validate(S.comment), community.addComment);
router.delete('/community/:id/comments/:commentId', community.removeComment);

// ---- alerts ----
router.get('/alerts', alerts.list);
router.put('/alerts/:id/read', alerts.markRead);
router.post('/alerts/broadcast', adminOnly, validate(S.broadcastAlert), alerts.broadcast);
router.delete('/alerts/broadcast/:id', adminOnly, alerts.removeBroadcast);

// ---- admin ----
router.get('/admin/stats', adminOnly, admin.stats);
router.get('/admin/users', adminOnly, admin.listUsers);
router.put('/admin/users/:id', adminOnly, validate(S.adminUserUpdate), admin.updateUser);

module.exports = router;
