const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const referralSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
  patientAvatar: { type: String },
  fromOrganization: { type: String, required: true },
  toOrganization: { type: String, required: true },
  reason: { type: String, required: true },
  priority: { type: String, enum: ['normal', 'urgent', 'emergency'], default: 'normal' },
  notes: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  rejectionReason: { type: String },
  treatmentNotes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

referralSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Referral', referralSchema);
