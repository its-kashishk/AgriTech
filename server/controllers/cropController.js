const Crop = require('../models/Crop');
const FarmActivity = require('../models/FarmActivity');
const ownedCrud = require('../utils/ownedCrud');
const { assertOwnFarm } = require('../utils/farmCheck');

module.exports = ownedCrud(Crop, {
  label: 'Crop',
  filterFields: ['farm', 'status', 'stage', 'type'],
  populate: { path: 'farm', select: 'name location' },
  sort: 'expectedHarvestDate',
  beforeWrite: assertOwnFarm,
  afterRemove: (crop) => FarmActivity.updateMany({ crop: crop._id }, { $unset: { crop: 1 } }),
});
