const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: ['equipment-rental', 'consultation', 'other'], required: true, index: true },
    description: { type: String, trim: true, maxlength: 800 },
    price: { type: Number, required: true, min: 0 },
    priceUnit: { type: String, default: 'per booking', trim: true, maxlength: 30 },
    slots: { type: [String], default: ['09:00-12:00', '14:00-17:00'] },
    // Simplified availability model: at most this many active bookings per (service, date, slot).
    capacityPerSlot: { type: Number, default: 1, min: 1 },
    active: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Service', serviceSchema);
