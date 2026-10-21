const mongoose = require('mongoose');

// Alerts are either produced by documented RULES (source: 'rule') or posted by an admin.
// They are advisories, not predictions.
const alertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // null = broadcast to everyone
    type: { type: String, enum: ['weather', 'harvest', 'soil', 'pest-disease', 'general'], required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 600 },
    source: { type: String, enum: ['rule', 'admin'], default: 'rule' },
    rule: String, // rule id, e.g. "HUMID_WARM_FUNGAL"
    key: { type: String, required: true }, // de-duplication key per user
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
// key is always set (rules: rule+scope+date, admin: unique id) so one user never gets the same rule alert twice per day
alertSchema.index({ user: 1, key: 1 }, { unique: true });
module.exports = mongoose.model('Alert', alertSchema);
