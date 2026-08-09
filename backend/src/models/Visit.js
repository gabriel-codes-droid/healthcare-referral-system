const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const visitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: { type: String },
  clinicName: { type: String },
  chiefComplaint: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  notes: { type: String, default: '' },
  referralNeeded: { type: Boolean, default: false },
  visitedAt: { type: Date, default: Date.now }
});

visitSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Visit', visitSchema);
