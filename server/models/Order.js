const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: String, // snapshot so history survives product edits
    price: Number, // unit price taken from the DB at order time
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending', index: true },
    shippingAddress: { type: String, required: true, trim: true, maxlength: 300 },
    // Demo checkout only. No card data is ever collected or stored.
    paymentMethod: { type: String, enum: ['demo'], default: 'demo' },
    paymentStatus: { type: String, enum: ['simulated'], default: 'simulated' },
  },
  { timestamps: true }
);
module.exports = mongoose.model('Order', orderSchema);
