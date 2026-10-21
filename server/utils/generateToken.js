const jwt = require('jsonwebtoken');
// Signs a short-lived JWT that only carries the user id. Role is always re-read from the DB.
module.exports = (userId) =>
  jwt.sign({ id: String(userId) }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
