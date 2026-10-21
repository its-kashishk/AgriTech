const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    coordinates: { lat: { type: Number, min: -90, max: 90 }, lon: { type: Number, min: -180, max: 180 } },
    size: { type: Number, required: true, min: [0.01, 'Size must be greater than 0'] },
    sizeUnit: { type: String, enum: ['acre', 'hectare'], default: 'acre' },
    soilType: { type: String, enum: ['alluvial', 'black', 'red', 'laterite', 'sandy', 'clay', 'loamy', 'other'], default: 'other' },
    irrigation: { type: String, enum: ['rainfed', 'canal', 'tubewell', 'drip', 'sprinkler', 'other'], default: 'rainfed' },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);
// One farmer cannot have two farms with the same name.
farmSchema.index({ owner: 1, name: 1 }, { unique: true });
module.exports = mongoose.model('Farm', farmSchema);
