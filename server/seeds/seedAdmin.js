// Usage: set ADMIN_EMAIL, ADMIN_PASSWORD (and optional ADMIN_NAME) in server/.env, then: npm run seed:admin
// Creates the admin, or promotes an existing user with that email. No password is stored in source code.
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first.'); process.exit(1); }
  if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.startsWith('change-me')) { console.error('Choose a real password (8+ chars, not the placeholder).'); process.exit(1); }
  await connectDB();
  let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (user) { user.role = 'admin'; user.active = true; user.password = ADMIN_PASSWORD; await user.save(); console.log(`Existing user promoted to admin: ${user.email}`); }
  else { user = await User.create({ name: ADMIN_NAME || 'Administrator', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' }); console.log(`Admin created: ${user.email}`); }
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
