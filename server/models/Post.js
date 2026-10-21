const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 150 },
    body: { type: String, required: true, trim: true, minlength: 5, maxlength: 3000 },
    category: { type: String, enum: ['question', 'tip', 'discussion', 'pest-disease'], default: 'discussion', index: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);
postSchema.index({ createdAt: -1 });
module.exports = mongoose.model('Post', postSchema);
