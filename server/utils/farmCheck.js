const Farm = require('../models/Farm');
const Crop = require('../models/Crop');
const ApiError = require('./ApiError');

// A referenced farm/crop must belong to the logged-in user (prevents attaching data to someone else's farm).
exports.assertOwnFarm = async (req, body) => {
  if (!body.farm) return;
  const farm = await Farm.findOne({ _id: body.farm, owner: req.user.id });
  if (!farm) throw new ApiError(404, 'Farm not found');
};
exports.assertOwnCrop = async (req, body) => {
  if (!body.crop) return;
  const crop = await Crop.findOne({ _id: body.crop, owner: req.user.id });
  if (!crop) throw new ApiError(404, 'Crop not found');
  if (body.farm && String(crop.farm) !== String(body.farm)) throw new ApiError(400, 'That crop does not belong to the selected farm');
};
