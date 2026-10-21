process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-123';
process.env.OPENWEATHER_API_KEY = 'fake-key-for-tests';
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

const uri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/agritech_test';

exports.connect = async () => {
  // Safety: tests wipe the database, so it must be clearly a test database.
  if (!/_test(\?|$)/.test(uri.split('/').pop())) throw new Error('MONGO_URI_TEST database name must end with _test');
  await mongoose.connect(uri);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
};
exports.disconnect = async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); };
exports.api = () => request(app);

let n = 0;
exports.makeFarmer = async (name = 'Farmer') => {
  n += 1;
  const email = `${name.toLowerCase()}${n}@example.com`;
  const res = await request(app).post('/api/auth/register').send({ name, email, password: 'Passw0rdX' });
  return { token: res.body.data.token, id: res.body.data.user._id, email, auth: { Authorization: `Bearer ${res.body.data.token}` } };
};
exports.makeAdmin = async () => {
  n += 1;
  const email = `admin${n}@example.com`;
  await User.create({ name: 'Admin', email, password: 'Passw0rdX', role: 'admin' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Passw0rdX' });
  return { token: res.body.data.token, id: res.body.data.user._id, auth: { Authorization: `Bearer ${res.body.data.token}` } };
};
