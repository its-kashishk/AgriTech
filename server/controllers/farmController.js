const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const FarmActivity = require('../models/FarmActivity');
const SoilRecord = require('../models/SoilRecord');
const ownedCrud = require('../utils/ownedCrud');

module.exports = ownedCrud(Farm, {
  label: 'Farm',
  sort: 'name',
  // deleting a farm removes its crops, activities and soil records
  afterRemove: async (farm) => {
    await Promise.all([Crop, FarmActivity, SoilRecord].map((M) => M.deleteMany({ farm: farm._id })));
  },
});
