const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const messageSchema = new mongoose.Schema({
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true },
  senderName: { type: String, required: true },
  senderOrg: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

messageSchema.plugin(toJSONPlugin);
messageSchema.index({ referralId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
