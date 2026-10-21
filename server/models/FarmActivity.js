const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    crop: { type: mongoose.Schema.Types.ObjectId, ref: 'Crop' },
    type: { type: String, enum: ['sowing', 'irrigation', 'fertilizing', 'pesticide', 'weeding', 'harvesting', 'other'], required: true },
    date: { type: Date, required: true },
    quantity: { type: String, trim: true, maxlength: 60 },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);
activitySchema.index({ owner: 1, date: -1 });
module.exports = mongoose.model('FarmActivity', activitySchema);
