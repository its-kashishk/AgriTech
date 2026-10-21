const mongoose = require('mongoose');

// Farmer-entered observations (e.g. from a soil test card). The app has NO sensors.
const soilSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    observedAt: { type: Date, required: true },
    ph: { type: Number, min: 0, max: 14 },
    moisture: { type: Number, min: 0, max: 100 }, // percent
    nitrogen: { type: Number, min: 0 }, // kg/ha as printed on a soil test card
    phosphorus: { type: Number, min: 0 },
    potassium: { type: Number, min: 0 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);
soilSchema.index({ farm: 1, observedAt: -1 });
module.exports = mongoose.model('SoilRecord', soilSchema);
