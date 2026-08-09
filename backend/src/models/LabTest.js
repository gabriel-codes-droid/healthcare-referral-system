const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const labTestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', default: null },
  testType: { type: String, required: true },
  labName: { type: String, default: '' },
  requestedBy: { type: String, required: true },
  requestedByOrg: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  notes: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  completedDate: { type: Date }
});

labTestSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('LabTest', labTestSchema);
