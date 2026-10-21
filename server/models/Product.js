const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: ['seed', 'fertilizer', 'pesticide', 'tool', 'equipment', 'other'], required: true, index: true },
    description: { type: String, trim: true, maxlength: 800 },
    price: { type: Number, required: true, min: 0 }, // INR per unit
    unit: { type: String, default: 'unit', trim: true, maxlength: 20 },
    stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    imageUrl: { type: String, trim: true, maxlength: 400 },
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false }, // seeded sample listing – shown with a "Demo" badge
  },
  { timestamps: true }
);
productSchema.index({ name: 1 }); // search uses an escaped, case-insensitive regex on name
module.exports = mongoose.model('Product', productSchema);
