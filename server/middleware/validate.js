const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// Strip Mongo operator keys ($where, a.b) from user input to block NoSQL injection.
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}
exports.sanitizeBody = (req, res, next) => {
  if (req.body) req.body = clean(req.body);
  next();
};

// validate(schema): parses req.body with a zod schema; unknown fields are dropped.
exports.validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw new ApiError(400, errors[0] ? `${errors[0].field ? errors[0].field + ': ' : ''}${errors[0].message}` : 'Invalid input', errors);
  }
  req.body = result.data;
  next();
};

// router.param('id', validId) → 400 for malformed ObjectIds.
exports.validId = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) throw new ApiError(400, 'Invalid id');
  next();
};
