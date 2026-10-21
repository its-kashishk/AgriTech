const FarmActivity = require('../models/FarmActivity');
const ownedCrud = require('../utils/ownedCrud');
const { assertOwnFarm, assertOwnCrop } = require('../utils/farmCheck');

module.exports = ownedCrud(FarmActivity, {
  label: 'Activity',
  filterFields: ['farm', 'crop', 'type'],
  populate: [{ path: 'farm', select: 'name' }, { path: 'crop', select: 'name' }],
  sort: '-date',
  beforeWrite: async (req, body) => { await assertOwnFarm(req, body); await assertOwnCrop(req, body); },
});
