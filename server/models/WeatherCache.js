const mongoose = require('mongoose');

// Caches provider responses for a few minutes to stay inside API rate limits.
const weatherCacheSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // "city:pune" or "geo:18.52,73.86"
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    fetchedAt: { type: Date, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model('WeatherCache', weatherCacheSchema);
