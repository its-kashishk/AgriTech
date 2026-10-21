const Alert = require('../models/Alert');
const Crop = require('../models/Crop');
const SoilRecord = require('../models/SoilRecord');

/*
 * RULE-BASED ADVISORIES (transparent, not AI, not outbreak prediction).
 *  HUMID_WARM_FUNGAL : humidity >= 80% and 15-30 °C         -> conditions generally favour fungal diseases
 *  HEAT_STRESS       : temperature >= 38 °C                 -> heat stress / irrigation check
 *  FROST_RISK        : temperature <= 5 °C                  -> frost risk for sensitive crops
 *  HIGH_WIND         : wind >= 10 m/s                       -> avoid spraying
 *  RAIN_SOON         : rain chance >= 60% in next 2 days    -> consider delaying spraying/fertiliser
 *  HARVEST_SOON      : active crop harvest due in <= 7 days
 *  HARVEST_OVERDUE   : active crop past expected harvest date
 *  SOIL_PH_LOW/HIGH  : latest soil pH < 5.5 or > 8.0
 *  SOIL_DRY          : latest soil moisture < 20%
 */
const DAY = 864e5;
const today = () => new Date().toISOString().slice(0, 10);

async function save(userId, a) {
  const key = `${a.rule}:${a.scope || ''}:${today()}`;
  await Alert.updateOne(
    { user: userId, key },
    { $setOnInsert: { user: userId, key, source: 'rule', type: a.type, severity: a.severity, title: a.title, message: a.message, rule: a.rule } },
    { upsert: true }
  );
}

exports.evaluateWeather = async (userId, farm, weather) => {
  const crops = await Crop.countDocuments({ owner: userId, farm: farm._id, status: 'active' });
  if (!crops || !weather || !weather.current || weather.demo) return;
  const { temperature: t, humidity: h, windSpeed: w } = weather.current;
  const scope = String(farm._id);
  const where = `at ${farm.name}`;
  if (h >= 80 && t >= 15 && t <= 30) await save(userId, { rule: 'HUMID_WARM_FUNGAL', scope, type: 'pest-disease', severity: 'warning', title: `Warm, humid weather ${where}`, message: 'Warm and humid conditions generally favour fungal diseases. Inspect leaves regularly and consult your local agriculture officer if you see spots or mould.' });
  if (t >= 38) await save(userId, { rule: 'HEAT_STRESS', scope, type: 'weather', severity: 'warning', title: `High temperature ${where}`, message: `Temperature is ${t.toFixed(0)}°C. Check soil moisture and irrigate in the cooler part of the day if needed.` });
  if (t <= 5) await save(userId, { rule: 'FROST_RISK', scope, type: 'weather', severity: 'warning', title: `Low temperature ${where}`, message: `Temperature is ${t.toFixed(0)}°C. Frost-sensitive crops may need protection.` });
  if (w >= 10) await save(userId, { rule: 'HIGH_WIND', scope, type: 'weather', severity: 'info', title: `Strong wind ${where}`, message: 'Wind is strong. Avoid spraying pesticides or fertiliser until it calms down.' });
  const rain = (weather.forecast || []).slice(0, 2).some((d) => d.rainChance >= 60);
  if (rain) await save(userId, { rule: 'RAIN_SOON', scope, type: 'weather', severity: 'info', title: `Rain likely soon ${where}`, message: 'Rain chance is 60% or more in the next two days. Consider delaying spraying or fertiliser application.' });
};

exports.evaluateUser = async (userId) => {
  const now = Date.now();
  const crops = await Crop.find({ owner: userId, status: 'active' });
  for (const c of crops) {
    const left = (c.expectedHarvestDate.getTime() - now) / DAY;
    if (left < 0) await save(userId, { rule: 'HARVEST_OVERDUE', scope: String(c._id), type: 'harvest', severity: 'warning', title: `${c.name}: harvest date passed`, message: 'The expected harvest date has passed. Update the crop stage/status if harvested, or check crop maturity.' });
    else if (left <= 7) await save(userId, { rule: 'HARVEST_SOON', scope: String(c._id), type: 'harvest', severity: 'info', title: `${c.name}: harvest due soon`, message: `Expected harvest is in ${Math.ceil(left)} day(s). Plan labour, storage and transport.` });
  }
  const farmIds = [...new Set(crops.map((c) => String(c.farm)))];
  for (const f of farmIds) {
    const s = await SoilRecord.findOne({ owner: userId, farm: f }).sort('-observedAt');
    if (!s) continue;
    if (s.ph != null && s.ph < 5.5) await save(userId, { rule: 'SOIL_PH_LOW', scope: f, type: 'soil', severity: 'info', title: 'Soil is quite acidic', message: `Your latest recorded pH is ${s.ph}. Ask your local soil-testing lab or KVK whether liming is advisable.` });
    if (s.ph != null && s.ph > 8) await save(userId, { rule: 'SOIL_PH_HIGH', scope: f, type: 'soil', severity: 'info', title: 'Soil is quite alkaline', message: `Your latest recorded pH is ${s.ph}. Ask your local soil-testing lab or KVK about suitable amendments.` });
    if (s.moisture != null && s.moisture < 20) await save(userId, { rule: 'SOIL_DRY', scope: f, type: 'soil', severity: 'info', title: 'Soil moisture looks low', message: `You recorded ${s.moisture}% moisture. Check whether irrigation is due.` });
  }
};

// General, non-diagnostic soil guidance for the UI (ranges are common textbook ranges).
exports.soilGuidance = (s) => {
  const tips = [];
  if (s.ph != null) {
    if (s.ph < 5.5) tips.push('pH is strongly acidic: many crops prefer a higher pH. Ask a local expert about liming.');
    else if (s.ph <= 7.5) tips.push('pH is in the range suitable for most field crops (about 5.5–7.5).');
    else tips.push('pH is alkaline: some nutrients become less available. Ask a local expert about organic matter or gypsum.');
  }
  if (s.moisture != null) tips.push(s.moisture < 20 ? 'Moisture is low – check irrigation needs.' : s.moisture > 70 ? 'Moisture is high – make sure the field drains well.' : 'Moisture is in a moderate range.');
  tips.push('These are general notes from numbers you entered, not a laboratory diagnosis. Use an accredited soil-testing lab for fertiliser recommendations.');
  return tips;
};
