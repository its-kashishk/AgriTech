// Consistent response envelope: { success, data, message?, meta? }
exports.ok = (res, data, status = 200, extra = {}) =>
  res.status(status).json({ success: true, data, ...extra });

// Reads ?page & ?limit safely (limit capped at 50).
exports.pageParams = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

exports.meta = (page, limit, total) => ({
  meta: { page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) },
});

// Escape user text before using it in a RegExp (prevents regex injection / ReDoS).
exports.escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
