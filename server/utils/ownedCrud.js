const ApiError = require('./ApiError');
const { ok, pageParams, meta } = require('./respond');

/**
 * Builds list/get/create/update/remove handlers for a resource that belongs to ONE user (field `owner`).
 * Every query includes { owner: req.user.id }, so a farmer can never read or change another farmer's data.
 * options:
 *   filterFields : query params allowed as exact-match filters (e.g. ['farm','status'])
 *   populate     : mongoose populate spec
 *   sort         : default sort
 *   beforeWrite  : async (req, body) – extra checks (e.g. referenced farm must be owned by the user)
 *   afterRemove  : async (doc) – cascade clean-up
 *   decorate     : (doc) => extra fields for a single item
 */
module.exports = (Model, { filterFields = [], populate, sort = '-createdAt', beforeWrite, afterRemove, label = 'Record' } = {}) => ({
  list: async (req, res) => {
    const filter = { owner: req.user.id };
    for (const f of filterFields) if (req.query[f]) filter[f] = String(req.query[f]);
    const { page, limit, skip } = pageParams(req.query);
    let q = Model.find(filter).sort(sort).skip(skip).limit(limit);
    if (populate) q = q.populate(populate);
    const [items, total] = await Promise.all([q, Model.countDocuments(filter)]);
    ok(res, items, 200, meta(page, limit, total));
  },
  get: async (req, res) => {
    let q = Model.findOne({ _id: req.params.id, owner: req.user.id });
    if (populate) q = q.populate(populate);
    const doc = await q;
    if (!doc) throw new ApiError(404, `${label} not found`);
    ok(res, doc);
  },
  create: async (req, res) => {
    if (beforeWrite) await beforeWrite(req, req.body);
    const doc = await Model.create({ ...req.body, owner: req.user.id });
    ok(res, doc, 201, { message: `${label} created` });
  },
  update: async (req, res) => {
    const doc = await Model.findOne({ _id: req.params.id, owner: req.user.id });
    if (!doc) throw new ApiError(404, `${label} not found`);
    if (beforeWrite) await beforeWrite(req, req.body, doc);
    doc.set(req.body);
    await doc.save(); // runs schema validators
    ok(res, doc, 200, { message: `${label} updated` });
  },
  remove: async (req, res) => {
    const doc = await Model.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!doc) throw new ApiError(404, `${label} not found`);
    if (afterRemove) await afterRemove(doc);
    ok(res, { id: doc.id }, 200, { message: `${label} deleted` });
  },
});
