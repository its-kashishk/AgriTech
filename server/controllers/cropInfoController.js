const info = require('../data/cropInfo.json');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

const meta = info._meta;

// Search by name/type/season and optionally by type.
exports.list = (req, res) => {
  const q = String(req.query.q || '').toLowerCase().trim();
  const type = req.query.type ? String(req.query.type) : null;
  const items = info.crops
    .filter((c) => (!type || c.type === type) && (!q || [c.name, c.type, c.season, c.overview].join(' ').toLowerCase().includes(q)))
    .map(({ slug, name, type, season, durationDays, overview }) => ({ slug, name, type, season, durationDays, overview }));
  ok(res, items, 200, { meta: { ...meta, total: items.length } });
};

exports.get = (req, res) => {
  const crop = info.crops.find((c) => c.slug === req.params.slug);
  if (!crop) throw new ApiError(404, 'Crop information not found');
  ok(res, crop, 200, { meta });
};

// Flat pest & disease reference, optionally filtered by crop slug or text.
exports.pests = (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  const crop = req.query.crop ? String(req.query.crop) : null;
  const items = info.crops
    .filter((c) => !crop || c.slug === crop)
    .flatMap((c) => c.pests.map((p) => ({ ...p, crop: c.name, cropSlug: c.slug })))
    .filter((p) => !q || [p.name, p.symptoms, p.crop].join(' ').toLowerCase().includes(q));
  ok(res, items, 200, { meta });
};
