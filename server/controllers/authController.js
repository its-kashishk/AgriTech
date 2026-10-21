const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const { ok } = require('../utils/respond');

exports.register = async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) throw new ApiError(409, 'This email is already registered');
  // role is NOT read from the body: every self-registered account is a farmer.
  const user = await User.create({ ...req.body, role: 'farmer' });
  ok(res, { user, token: generateToken(user.id) }, 201, { message: 'Registration successful' });
};

exports.login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  // same message for unknown email and wrong password (no account enumeration)
  if (!user || !(await user.comparePassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.active) throw new ApiError(403, 'This account has been disabled. Contact the administrator');
  ok(res, { user, token: generateToken(user.id) }, 200, { message: 'Login successful' });
};

exports.me = async (req, res) => ok(res, req.user);

exports.updateProfile = async (req, res) => {
  req.user.set(req.body);
  await req.user.save();
  ok(res, req.user, 200, { message: 'Profile updated' });
};

exports.changePassword = async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  ok(res, null, 200, { message: 'Password changed' });
};
