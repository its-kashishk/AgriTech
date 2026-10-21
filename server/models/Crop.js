const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    variety: { type: String, trim: true, maxlength: 60 },
    type: { type: String, enum: ['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'cash', 'other'], default: 'other' },
    plot: { type: String, trim: true, maxlength: 60 },
    sowingDate: { type: Date, required: true },
    expectedHarvestDate: { type: Date, required: true },
    stage: { type: String, enum: ['sowing', 'germination', 'vegetative', 'flowering', 'fruiting', 'maturity', 'harvested'], default: 'sowing' },
    status: { type: String, enum: ['active', 'harvested', 'failed'], default: 'active' },
    healthNotes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);
cropSchema.index({ owner: 1, status: 1 });
cropSchema.pre('validate', function () {
  if (this.sowingDate && this.expectedHarvestDate && this.expectedHarvestDate <= this.sowingDate) {
    this.invalidate('expectedHarvestDate', 'Expected harvest date must be after the sowing date');
  }
});
module.exports = mongoose.model('Crop', cropSchema);
