const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: null },
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, default: '' },
  duration: { type: String, default: '' },
  notes: { type: String, default: '' },
  prescribedBy: { type: String, required: true },
  prescribedByOrg: { type: String, default: '' },
  prescribedAt: { type: Date, default: Date.now }
});

prescriptionSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Prescription', prescriptionSchema);
