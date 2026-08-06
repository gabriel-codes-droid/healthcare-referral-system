const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  clinicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clinicianName: String,
  organization: String,
  chiefComplaint: String,
  diagnosis: String,
  notes: String,
  referralNeeded: { type: Boolean, default: false },
  visitedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Visit', visitSchema);
