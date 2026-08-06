const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: String,
  body: { type: String, required: true, trim: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Message', messageSchema);
