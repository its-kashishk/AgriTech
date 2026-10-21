const { getWeather } = require('../services/weatherService');
const { evaluateWeather } = require('../services/alertService');
const Farm = require('../models/Farm');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/respond');

// GET /api/weather?city=Pune | ?lat=..&lon=.. | ?farm=<farmId>
exports.get = async (req, res) => {
  let { city, lat, lon } = req.query;
  let farm = null;
  if (req.query.farm) {
    farm = await Farm.findOne({ _id: String(req.query.farm), owner: req.user.id });
    if (!farm) throw new ApiError(404, 'Farm not found');
    if (farm.coordinates && farm.coordinates.lat != null) { lat = farm.coordinates.lat; lon = farm.coordinates.lon; city = undefined; }
    else city = farm.location;
  }
  if (!city && (lat == null || lon == null)) throw new ApiError(400, 'Provide a city, coordinates, or a farm');
  if (city) {
    city = String(city).trim();
    if (city.length < 2 || city.length > 100) throw new ApiError(400, 'City name must be 2-100 characters');
  } else {
    lat = Number(lat); lon = Number(lon);
    if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) throw new ApiError(400, 'Invalid coordinates');
  }
  const data = await getWeather({ city, lat, lon });
  if (farm) await evaluateWeather(req.user.id, farm, data);
  ok(res, data);
};
