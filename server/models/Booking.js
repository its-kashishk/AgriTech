const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true, index: true },
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm' },
    date: { type: Date, required: true }, // stored as midnight UTC of the chosen day
    slot: { type: String, required: true },
    notes: { type: String, trim: true, maxlength: 500 },
    price: { type: Number, min: 0 }, // snapshot of the service price
    status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'], default: 'pending', index: true },
  },
  { timestamps: true }
);
bookingSchema.index({ service: 1, date: 1, slot: 1, status: 1 });
module.exports = mongoose.model('Booking', bookingSchema);
