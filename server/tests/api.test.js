const { connect, disconnect, api, makeFarmer, makeAdmin } = require('./helpers');
const User = require('../models/User');

beforeAll(connect);
afterAll(disconnect);

const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const farmBody = (name = 'North Field') => ({ name, location: 'Pune', size: 4.5, sizeUnit: 'acre', soilType: 'black', irrigation: 'drip' });

describe('Authentication', () => {
  test('registers a farmer, hashes the password, never returns it', async () => {
    const r = await api().post('/api/auth/register').send({ name: 'Asha', email: 'asha@example.com', password: 'Secret123' });
    expect(r.status).toBe(201);
    expect(r.body.data.token).toBeTruthy();
    expect(r.body.data.user.password).toBeUndefined();
    const stored = await User.findOne({ email: 'asha@example.com' }).select('+password');
    expect(stored.password).not.toBe('Secret123');
    expect(stored.password).toMatch(/^\$2[aby]\$/);
  });
  test('cannot self-register as admin', async () => {
    const r = await api().post('/api/auth/register').send({ name: 'Evil', email: 'evil@example.com', password: 'Secret123', role: 'admin' });
    expect(r.status).toBe(201);
    expect(r.body.data.user.role).toBe('farmer');
  });
  test('rejects duplicate email, weak password, bad email', async () => {
    expect((await api().post('/api/auth/register').send({ name: 'Asha', email: 'asha@example.com', password: 'Secret123' })).status).toBe(409);
    expect((await api().post('/api/auth/register').send({ name: 'Bo', email: 'bo@example.com', password: 'short' })).status).toBe(400);
    expect((await api().post('/api/auth/register').send({ name: 'Bo', email: 'nope', password: 'Secret123' })).status).toBe(400);
  });
  test('login success and invalid credentials give the same safe error', async () => {
    expect((await api().post('/api/auth/login').send({ email: 'asha@example.com', password: 'Secret123' })).status).toBe(200);
    const wrongPw = await api().post('/api/auth/login').send({ email: 'asha@example.com', password: 'Wrong1234' });
    const noUser = await api().post('/api/auth/login').send({ email: 'ghost@example.com', password: 'Wrong1234' });
    expect(wrongPw.status).toBe(401); expect(noUser.status).toBe(401);
    expect(wrongPw.body.message).toBe(noUser.body.message);
  });
  test('blocks NoSQL operator injection in login', async () => {
    const r = await api().post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(r.status).toBe(400);
  });
  test('protected routes need a valid token', async () => {
    expect((await api().get('/api/farms')).status).toBe(401);
    expect((await api().get('/api/farms').set('Authorization', 'Bearer garbage')).status).toBe(401);
  });
  test('profile update and password change', async () => {
    const f = await makeFarmer('Prof');
    const up = await api().put('/api/users/me').set(f.auth).send({ name: 'New Name', language: 'hi', role: 'admin' });
    expect(up.status).toBe(200); expect(up.body.data.name).toBe('New Name'); expect(up.body.data.role).toBe('farmer');
    expect((await api().put('/api/users/me/password').set(f.auth).send({ currentPassword: 'bad', newPassword: 'Another123' })).status).toBe(400);
    expect((await api().put('/api/users/me/password').set(f.auth).send({ currentPassword: 'Passw0rdX', newPassword: 'Another123' })).status).toBe(200);
    expect((await api().post('/api/auth/login').send({ email: f.email, password: 'Another123' })).status).toBe(200);
  });
  test('disabled accounts cannot log in or use old tokens', async () => {
    const admin = await makeAdmin(); const f = await makeFarmer('Dis');
    await api().put(`/api/admin/users/${f.id}`).set(admin.auth).send({ active: false }).expect(200);
    expect((await api().post('/api/auth/login').send({ email: f.email, password: 'Passw0rdX' })).status).toBe(403);
    expect((await api().get('/api/auth/me').set(f.auth)).status).toBe(401);
  });
});

describe('Farms, crops and ownership', () => {
  let a, b, farm;
  beforeAll(async () => { a = await makeFarmer('Alice'); b = await makeFarmer('Bob'); });

  test('farm CRUD for the owner with validation', async () => {
    expect((await api().post('/api/farms').set(a.auth).send({ name: 'x', location: 'Pune', size: -1 })).status).toBe(400);
    const c = await api().post('/api/farms').set(a.auth).send(farmBody());
    expect(c.status).toBe(201); farm = c.body.data;
    expect((await api().post('/api/farms').set(a.auth).send(farmBody())).status).toBe(409); // duplicate name per owner
    expect((await api().put(`/api/farms/${farm._id}`).set(a.auth).send({ size: 6 })).body.data.size).toBe(6);
    const list = await api().get('/api/farms').set(a.auth);
    expect(list.body.data).toHaveLength(1); expect(list.body.meta.total).toBe(1);
  });
  test("another farmer cannot read, edit or delete someone else's farm", async () => {
    expect((await api().get(`/api/farms/${farm._id}`).set(b.auth)).status).toBe(404);
    expect((await api().put(`/api/farms/${farm._id}`).set(b.auth).send({ size: 1 })).status).toBe(404);
    expect((await api().delete(`/api/farms/${farm._id}`).set(b.auth)).status).toBe(404);
    expect((await api().get('/api/farms').set(b.auth)).body.data).toHaveLength(0);
  });
  test('invalid ids return 400', async () => { expect((await api().get('/api/farms/not-an-id').set(a.auth)).status).toBe(400); });

  test('crop validation: harvest after sowing, farm must be yours', async () => {
    const bad = await api().post('/api/crops').set(a.auth).send({ farm: farm._id, name: 'Wheat', sowingDate: day(0), expectedHarvestDate: day(-5) });
    expect(bad.status).toBe(400); expect(bad.body.message).toMatch(/after the sowing/);
    const steal = await api().post('/api/crops').set(b.auth).send({ farm: farm._id, name: 'Wheat', sowingDate: day(0), expectedHarvestDate: day(100) });
    expect(steal.status).toBe(404);
    const ok = await api().post('/api/crops').set(a.auth).send({ farm: farm._id, name: 'Wheat', type: 'cereal', sowingDate: day(0), expectedHarvestDate: day(120) });
    expect(ok.status).toBe(201);
    const upd = await api().put(`/api/crops/${ok.body.data._id}`).set(a.auth).send({ stage: 'vegetative', expectedHarvestDate: day(-3) });
    expect(upd.status).toBe(400); // update that breaks date rule is rejected too
    expect((await api().put(`/api/crops/${ok.body.data._id}`).set(a.auth).send({ stage: 'vegetative' })).body.data.stage).toBe('vegetative');
    const filt = await api().get(`/api/crops?farm=${farm._id}&stage=vegetative`).set(a.auth);
    expect(filt.body.data).toHaveLength(1);
    expect((await api().get(`/api/crops/${ok.body.data._id}`).set(b.auth)).status).toBe(404);
  });
  test('activities and soil records enforce farm ownership; soil guidance works', async () => {
    const act = { farm: farm._id, type: 'irrigation', date: day(-1), notes: 'Drip 2h' };
    expect((await api().post('/api/activities').set(b.auth).send(act)).status).toBe(404);
    expect((await api().post('/api/activities').set(a.auth).send(act)).status).toBe(201);
    expect((await api().post('/api/soil').set(a.auth).send({ farm: farm._id, observedAt: day(-2), ph: 15 })).status).toBe(400);
    const s = await api().post('/api/soil').set(a.auth).send({ farm: farm._id, observedAt: day(-2), ph: 5.0, moisture: 15 });
    expect(s.status).toBe(201);
    const g = await api().get(`/api/soil/${s.body.data._id}/guidance`).set(a.auth);
    expect(g.body.data.guidance.join(' ')).toMatch(/acidic/);
    expect(g.body.data.guidance.join(' ')).toMatch(/not a laboratory diagnosis/);
  });
  test('deleting a farm cascades to crops, activities and soil', async () => {
    const f2 = (await api().post('/api/farms').set(a.auth).send(farmBody('Temp'))).body.data;
    await api().post('/api/crops').set(a.auth).send({ farm: f2._id, name: 'Rice', sowingDate: day(0), expectedHarvestDate: day(100) });
    await api().delete(`/api/farms/${f2._id}`).set(a.auth).expect(200);
    expect((await api().get(`/api/crops?farm=${f2._id}`).set(a.auth)).body.data).toHaveLength(0);
  });
});

describe('Crop information', () => {
  let u; beforeAll(async () => { u = await makeFarmer('Info'); });
  test('lists, searches and shows details with source disclaimer', async () => {
    const all = await api().get('/api/crop-info').set(u.auth);
    expect(all.body.data.length).toBeGreaterThanOrEqual(8); expect(all.body.meta.disclaimer).toBeTruthy();
    expect((await api().get('/api/crop-info?q=tomato').set(u.auth)).body.data[0].slug).toBe('tomato');
    expect((await api().get('/api/crop-info/wheat').set(u.auth)).body.data.pests.length).toBeGreaterThan(0);
    expect((await api().get('/api/crop-info/unknown').set(u.auth)).status).toBe(404);
    expect((await api().get('/api/crop-info/pests?crop=rice').set(u.auth)).body.data.every((p) => p.cropSlug === 'rice')).toBe(true);
  });
});

describe('Marketplace and orders', () => {
  let admin, f, g, product;
  beforeAll(async () => { admin = await makeAdmin(); f = await makeFarmer('Buyer'); g = await makeFarmer('Buyer2'); });

  test('only admins manage products; validation applies', async () => {
    const body = { name: 'Urea', category: 'fertilizer', price: 270, stock: 3, unit: 'bag' };
    expect((await api().post('/api/products').set(f.auth).send(body)).status).toBe(403);
    expect((await api().post('/api/products').set(admin.auth).send({ ...body, stock: -1 })).status).toBe(400);
    expect((await api().post('/api/products').set(admin.auth).send({ ...body, price: -5 })).status).toBe(400);
    const r = await api().post('/api/products').set(admin.auth).send(body);
    expect(r.status).toBe(201); product = r.body.data;
  });
  test('search and category filters', async () => {
    expect((await api().get('/api/products?q=ure').set(f.auth)).body.data).toHaveLength(1);
    expect((await api().get('/api/products?category=seed').set(f.auth)).body.data).toHaveLength(0);
  });
  test('price and total come from the database, not the client', async () => {
    const r = await api().post('/api/orders').set(f.auth).send({ items: [{ product: product._id, quantity: 1, price: 1 }], total: 1, shippingAddress: '12 Farm Road, Pune' });
    expect(r.status).toBe(201);
    expect(r.body.data.total).toBe(270); expect(r.body.data.items[0].price).toBe(270);
    expect(r.body.data.paymentStatus).toBe('simulated');
    expect((await api().get(`/api/products/${product._id}`).set(f.auth)).body.data.stock).toBe(2);
  });
  test('cannot oversell: 409 and stock untouched', async () => {
    const r = await api().post('/api/orders').set(f.auth).send({ items: [{ product: product._id, quantity: 5 }], shippingAddress: '12 Farm Road, Pune' });
    expect(r.status).toBe(409);
    expect((await api().get(`/api/products/${product._id}`).set(f.auth)).body.data.stock).toBe(2);
  });
  test('multi-item order that fails halfway rolls stock back', async () => {
    const p2 = (await api().post('/api/products').set(admin.auth).send({ name: 'Seed', category: 'seed', price: 100, stock: 10 })).body.data;
    const r = await api().post('/api/orders').set(f.auth).send({ items: [{ product: p2._id, quantity: 4 }, { product: product._id, quantity: 9 }], shippingAddress: '12 Farm Road, Pune' });
    expect(r.status).toBe(409);
    expect((await api().get(`/api/products/${p2._id}`).set(f.auth)).body.data.stock).toBe(10);
  });
  test('parallel orders never push stock below zero', async () => {
    const p3 = (await api().post('/api/products').set(admin.auth).send({ name: 'Rare', category: 'tool', price: 50, stock: 3 })).body.data;
    const results = await Promise.all(Array.from({ length: 8 }, () => api().post('/api/orders').set(g.auth).send({ items: [{ product: p3._id, quantity: 1 }], shippingAddress: '12 Farm Road, Pune' })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(3);
    expect(results.filter((r) => r.status === 409)).toHaveLength(5);
    expect((await api().get(`/api/products/${p3._id}`).set(g.auth)).body.data.stock).toBe(0);
  });
  test('order history is private; cancel restores stock; admin flow is enforced', async () => {
    const mine = await api().get('/api/orders').set(f.auth);
    const order = mine.body.data[0];
    expect((await api().get(`/api/orders/${order._id}`).set(g.auth)).status).toBe(404);
    expect((await api().get('/api/orders/admin/all').set(f.auth)).status).toBe(403);
    expect((await api().put(`/api/orders/${order._id}/status`).set(f.auth).send({ status: 'shipped' })).status).toBe(403);
    expect((await api().put(`/api/orders/${order._id}/status`).set(admin.auth).send({ status: 'delivered' })).status).toBe(400);
    await api().put(`/api/orders/${order._id}/status`).set(admin.auth).send({ status: 'confirmed' }).expect(200);
    expect((await api().put(`/api/orders/${order._id}/cancel`).set(f.auth)).status).toBe(400); // not pending anymore
    const o2 = (await api().post('/api/orders').set(f.auth).send({ items: [{ product: product._id, quantity: 2 }], shippingAddress: '12 Farm Road, Pune' })).body.data;
    expect((await api().get(`/api/products/${product._id}`).set(f.auth)).body.data.stock).toBe(0);
    await api().put(`/api/orders/${o2._id}/cancel`).set(f.auth).expect(200);
    expect((await api().get(`/api/products/${product._id}`).set(f.auth)).body.data.stock).toBe(2);
    expect((await api().get('/api/orders/admin/all').set(admin.auth)).body.data.length).toBeGreaterThan(3);
  });
  test('inactive products cannot be ordered', async () => {
    await api().delete(`/api/products/${product._id}`).set(admin.auth).expect(200);
    expect((await api().post('/api/orders').set(f.auth).send({ items: [{ product: product._id, quantity: 1 }], shippingAddress: '12 Farm Road, Pune' })).status).toBe(404);
    expect((await api().get('/api/products').set(f.auth)).body.data.find((p) => p._id === product._id)).toBeUndefined();
  });
});

describe('Services and bookings', () => {
  let admin, f, g, svc;
  beforeAll(async () => {
    admin = await makeAdmin(); f = await makeFarmer('Booker'); g = await makeFarmer('Booker2');
    svc = (await api().post('/api/services').set(admin.auth).send({ name: 'Tractor', category: 'equipment-rental', price: 1200, slots: ['09:00-12:00', '14:00-17:00'], capacityPerSlot: 1 })).body.data;
  });
  test('farmers cannot create services', async () => { expect((await api().post('/api/services').set(f.auth).send({ name: 'x', category: 'other', price: 1 })).status).toBe(403); });
  test('rejects past dates and unknown slots', async () => {
    expect((await api().post('/api/bookings').set(f.auth).send({ service: svc._id, date: day(-2), slot: '09:00-12:00' })).status).toBe(400);
    expect((await api().post('/api/bookings').set(f.auth).send({ service: svc._id, date: day(3), slot: '01:00-02:00' })).status).toBe(400);
  });
  test('create, capacity limit, cancel frees the slot', async () => {
    const b1 = await api().post('/api/bookings').set(f.auth).send({ service: svc._id, date: day(3), slot: '09:00-12:00' });
    expect(b1.status).toBe(201); expect(b1.body.data.price).toBe(1200);
    expect((await api().post('/api/bookings').set(g.auth).send({ service: svc._id, date: day(3), slot: '09:00-12:00' })).status).toBe(409);
    expect((await api().put(`/api/bookings/${b1.body.data._id}/cancel`).set(g.auth)).status).toBe(400); // not g's booking
    await api().put(`/api/bookings/${b1.body.data._id}/cancel`).set(f.auth).expect(200);
    expect((await api().post('/api/bookings').set(g.auth).send({ service: svc._id, date: day(3), slot: '09:00-12:00' })).status).toBe(201);
  });
  test('update only while pending; admin confirms; then update is blocked', async () => {
    const b = (await api().post('/api/bookings').set(f.auth).send({ service: svc._id, date: day(5), slot: '14:00-17:00', notes: 'ploughing' })).body.data;
    expect((await api().put(`/api/bookings/${b._id}`).set(f.auth).send({ slot: '09:00-12:00' })).body.data.slot).toBe('09:00-12:00');
    expect((await api().put(`/api/bookings/${b._id}/status`).set(f.auth).send({ status: 'confirmed' })).status).toBe(403);
    await api().put(`/api/bookings/${b._id}/status`).set(admin.auth).send({ status: 'confirmed' }).expect(200);
    expect((await api().put(`/api/bookings/${b._id}`).set(f.auth).send({ slot: '14:00-17:00' })).status).toBe(400);
    expect((await api().put(`/api/bookings/${b._id}/status`).set(admin.auth).send({ status: 'pending' })).status).toBe(400);
    expect((await api().get('/api/bookings').set(f.auth)).body.data.length).toBeGreaterThanOrEqual(2);
    expect((await api().get(`/api/bookings/${b._id}`).set(g.auth)).status).toBe(404);
    expect((await api().get('/api/bookings/admin/all').set(admin.auth)).body.data.length).toBeGreaterThanOrEqual(3);
  });
  test('service with open bookings cannot be deleted', async () => { expect((await api().delete(`/api/services/${svc._id}`).set(admin.auth)).status).toBe(409); });
});

describe('Weather (provider mocked)', () => {
  let u; const realFetch = global.fetch;
  const current = { name: 'Pune', sys: { country: 'IN' }, coord: { lat: 18.5, lon: 73.8 }, main: { temp: 24, feels_like: 25, humidity: 85, pressure: 1010 }, wind: { speed: 3 }, weather: [{ description: 'light rain', icon: '10d' }], dt: 1700000000 };
  const forecast = { list: [0, 1, 2, 3].map((i) => ({ dt_txt: `2030-01-0${1 + Math.floor(i / 2)} ${i % 2 ? '12' : '09'}:00:00`, main: { temp_min: 20, temp_max: 26, humidity: 80, temp: 23 }, pop: 0.7, weather: [{ description: 'rain', icon: '10d' }] })) };
  beforeAll(async () => { u = await makeFarmer('Wx'); });
  afterEach(() => { global.fetch = realFetch; });
  const mock = (fn) => { global.fetch = jest.fn(fn); };

  test('returns normalized weather with location, retrieval time, and caches', async () => {
    mock(async (url) => ({ ok: true, status: 200, json: async () => (String(url).includes('/forecast') ? forecast : current) }));
    const r1 = await api().get('/api/weather?city=Pune').set(u.auth);
    expect(r1.status).toBe(200);
    expect(r1.body.data.current).toMatchObject({ temperature: 24, humidity: 85, pressure: 1010, windSpeed: 3, description: 'light rain' });
    expect(r1.body.data.current.location.name).toBe('Pune'); expect(r1.body.data.retrievedAt).toBeTruthy();
    expect(r1.body.data.forecast.length).toBe(2); expect(r1.body.data.cached).toBe(false);
    const calls = global.fetch.mock.calls.length;
    const r2 = await api().get('/api/weather?city=pune').set(u.auth);
    expect(r2.body.data.cached).toBe(true); expect(global.fetch.mock.calls.length).toBe(calls);
    expect(JSON.stringify(global.fetch.mock.calls)).toContain('fake-key-for-tests'); // key is only ever sent server-side
    expect(JSON.stringify(r1.body)).not.toContain('fake-key-for-tests');
  });
  test('coordinates lookup and validation', async () => {
    mock(async () => ({ ok: true, status: 200, json: async () => current }));
    expect((await api().get('/api/weather?lat=18.52&lon=73.85').set(u.auth)).status).toBe(200);
    expect((await api().get('/api/weather?lat=999&lon=1').set(u.auth)).status).toBe(400);
    expect((await api().get('/api/weather').set(u.auth)).status).toBe(400);
  });
  test('invalid city → 404, provider key error → 502, network failure → 504, rate limit → 503', async () => {
    mock(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    expect((await api().get('/api/weather?city=Nowhereville').set(u.auth)).status).toBe(404);
    mock(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    expect((await api().get('/api/weather?city=Auth1').set(u.auth)).status).toBe(502);
    mock(async () => { throw new Error('ECONNRESET'); });
    expect((await api().get('/api/weather?city=Net1').set(u.auth)).status).toBe(504);
    mock(async () => ({ ok: false, status: 429, json: async () => ({}) }));
    expect((await api().get('/api/weather?city=Rate1').set(u.auth)).status).toBe(503);
  });
  test('missing key → 503 (no fake data) unless demo mode is explicitly on and labelled', async () => {
    const key = process.env.OPENWEATHER_API_KEY; delete process.env.OPENWEATHER_API_KEY;
    expect((await api().get('/api/weather?city=Pune').set(u.auth)).status).toBe(503);
    process.env.OPENWEATHER_DEMO = 'true';
    const d = await api().get('/api/weather?city=Pune').set(u.auth);
    expect(d.body.data.demo).toBe(true); expect(d.body.data.current.description).toMatch(/DEMO/);
    delete process.env.OPENWEATHER_DEMO; process.env.OPENWEATHER_API_KEY = key;
  });
  test('weather for a farm creates a rule-based alert (labelled source "rule")', async () => {
    mock(async (url) => ({ ok: true, status: 200, json: async () => (String(url).includes('/forecast') ? forecast : current) }));
    const farm = (await api().post('/api/farms').set(u.auth).send({ ...farmBody('Wx Farm'), location: 'Alertville' })).body.data;
    await api().post('/api/crops').set(u.auth).send({ farm: farm._id, name: 'Tomato', sowingDate: day(-20), expectedHarvestDate: day(70) });
    expect((await api().get(`/api/weather?farm=${farm._id}`).set(u.auth)).status).toBe(200);
    const al = await api().get('/api/alerts').set(u.auth);
    const rules = al.body.data.map((a) => a.rule);
    expect(rules).toContain('HUMID_WARM_FUNGAL'); expect(rules).toContain('RAIN_SOON');
    expect(al.body.data.every((a) => a.source === 'rule')).toBe(true);
    await api().get(`/api/weather?farm=${farm._id}`).set(u.auth);
    const again = await api().get('/api/alerts').set(u.auth);
    expect(again.body.data.filter((a) => a.rule === 'HUMID_WARM_FUNGAL')).toHaveLength(1); // de-duplicated
  });
});

describe('Alerts, dashboard, community and admin', () => {
  let admin, a, b;
  beforeAll(async () => { admin = await makeAdmin(); a = await makeFarmer('Cora'); b = await makeFarmer('Dev'); });

  test('harvest and soil rules; admin broadcast reaches farmers; farmers cannot broadcast', async () => {
    const farm = (await api().post('/api/farms').set(a.auth).send(farmBody('Alert Farm'))).body.data;
    await api().post('/api/crops').set(a.auth).send({ farm: farm._id, name: 'Maize', sowingDate: day(-100), expectedHarvestDate: day(3) });
    await api().post('/api/crops').set(a.auth).send({ farm: farm._id, name: 'Old', sowingDate: day(-200), expectedHarvestDate: day(-4) });
    await api().post('/api/soil').set(a.auth).send({ farm: farm._id, observedAt: day(-1), ph: 4.8, moisture: 10 });
    expect((await api().post('/api/alerts/broadcast').set(a.auth).send({ title: 'Hello', message: 'Spam spam' })).status).toBe(403);
    await api().post('/api/alerts/broadcast').set(admin.auth).send({ title: 'Locust advisory', message: 'Check local advisories', type: 'pest-disease', severity: 'warning' }).expect(201);
    const rules = (await api().get('/api/alerts').set(a.auth)).body.data;
    for (const r of ['HARVEST_SOON', 'HARVEST_OVERDUE', 'SOIL_PH_LOW', 'SOIL_DRY']) expect(rules.map((x) => x.rule)).toContain(r);
    expect(rules.some((x) => x.source === 'admin')).toBe(true);
    expect((await api().get('/api/alerts').set(b.auth)).body.data.some((x) => x.source === 'admin')).toBe(true);
    expect((await api().put(`/api/alerts/${rules.find((x) => x.rule === 'SOIL_DRY')._id}/read`).set(b.auth)).status).toBe(404); // not b's alert
  });
  test('farmer dashboard shows real counts; empty state for a new user', async () => {
    const d = (await api().get('/api/dashboard').set(a.auth)).body.data;
    expect(d.counts.farms).toBeGreaterThanOrEqual(1); expect(d.counts.activeCrops).toBe(2); expect(d.upcomingHarvests.length).toBeGreaterThan(0);
    const e = (await api().get('/api/dashboard').set(b.auth)).body.data;
    expect(e.counts.farms).toBe(0); expect(e.recentOrders).toEqual([]);
  });
  test('community: author-only edit, admin moderation, comments', async () => {
    const p = (await api().post('/api/community').set(a.auth).send({ title: 'Leaf spots on tomato', body: 'Any advice please?', category: 'question', tags: ['Tomato'] })).body.data;
    expect((await api().post('/api/community').set(a.auth).send({ title: 'x', body: 'y' })).status).toBe(400);
    expect((await api().put(`/api/community/${p._id}`).set(b.auth).send({ title: 'Hijacked title' })).status).toBe(403);
    expect((await api().delete(`/api/community/${p._id}`).set(b.auth)).status).toBe(403);
    const c = (await api().post(`/api/community/${p._id}/comments`).set(b.auth).send({ body: 'Try removing infected leaves' })).body.data;
    expect((await api().delete(`/api/community/${p._id}/comments/${c._id}`).set(a.auth)).status).toBe(403);
    const detail = (await api().get(`/api/community/${p._id}`).set(a.auth)).body.data;
    expect(detail.comments).toHaveLength(1); expect(detail.author.name).toBe('Cora');
    expect((await api().get('/api/community?tag=tomato').set(a.auth)).body.data[0].commentCount).toBe(1);
    await api().delete(`/api/community/${p._id}/comments/${c._id}`).set(admin.auth).expect(200);
    await api().delete(`/api/community/${p._id}`).set(admin.auth).expect(200);
    expect((await api().get(`/api/community/${p._id}`).set(a.auth)).status).toBe(404);
  });
  test('admin endpoints are admin-only; stats are real aggregates', async () => {
    for (const path of ['/api/admin/stats', '/api/admin/users']) expect((await api().get(path).set(a.auth)).status).toBe(403);
    const s = (await api().get('/api/admin/stats').set(admin.auth)).body.data;
    expect(s.totals.users).toBeGreaterThan(5); expect(s.totals.farms).toBeGreaterThan(0); expect(typeof s.totals.revenue).toBe('number');
    expect(Array.isArray(s.ordersByStatus)).toBe(true);
    const users = (await api().get('/api/admin/users?q=cora').set(admin.auth)).body.data;
    expect(users).toHaveLength(1); expect(users[0].password).toBeUndefined();
    expect((await api().put(`/api/admin/users/${admin.id}`).set(admin.auth).send({ role: 'farmer' })).status).toBe(400); // cannot demote self
    await api().put(`/api/admin/users/${b.id}`).set(admin.auth).send({ role: 'admin' }).expect(200);
    expect((await api().get('/api/admin/stats').set(b.auth)).status).toBe(200); // role is read from DB per request
  });
});

describe('Errors and hardening', () => {
  test('malformed JSON → 400, unknown API route → 404 (when logged in), no stack traces', async () => {
    const f = await makeFarmer('Err');
    const bad = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(bad.status).toBe(400); expect(JSON.stringify(bad.body)).not.toMatch(/at .*\.js/);
    const nf = await api().get('/api/does-not-exist').set(f.auth);
    expect(nf.status).toBe(404); expect(nf.body.success).toBe(false);
  });
  test('security headers present, x-powered-by hidden', async () => {
    const r = await api().get('/api/health');
    expect(r.headers['x-content-type-options']).toBe('nosniff'); expect(r.headers['x-powered-by']).toBeUndefined();
  });
});
