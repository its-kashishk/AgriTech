const SoilRecord = require('../models/SoilRecord');
const ownedCrud = require('../utils/ownedCrud');
const { assertOwnFarm } = require('../utils/farmCheck');
const { soilGuidance } = require('../services/alertService');
const { ok } = require('../utils/respond');

const crud = ownedCrud(SoilRecord, {
  label: 'Soil record',
  filterFields: ['farm'],
  populate: { path: 'farm', select: 'name' },
  sort: '-observedAt',
  beforeWrite: assertOwnFarm,
});

// Adds general guidance text to a single record.
crud.guidance = async (req, res) => {
  const s = await SoilRecord.findOne({ _id: req.params.id, owner: req.user.id });
  if (!s) return res.status(404).json({ success: false, message: 'Soil record not found' });
  ok(res, { record: s, guidance: soilGuidance(s) });
};
module.exports = crud;
