const ApiError = require('../utils/ApiError');

exports.notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Central error formatter. Never leaks stack traces or internals to the client.
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'ValidationError' && err.errors) {
    status = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0].message;
  } else if (err.name === 'CastError') {
    status = 400; message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409; message = 'A record with the same unique value already exists';
  } else if (err.type === 'entity.parse.failed') {
    status = 400; message = 'Malformed JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413; message = 'Request body too large';
  } else if (!err.status) {
    status = 500; message = 'Something went wrong on the server';
    if (process.env.NODE_ENV !== 'test') console.error('Unhandled error:', err.message);
  }
  res.status(status).json({ success: false, message, ...(details ? { errors: details } : {}) });
};
