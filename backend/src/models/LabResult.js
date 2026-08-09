const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const labResultSchema = new mongoose.Schema({
  labTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  testType: { type: String, required: true },
  findings: { type: String, required: true },
  summary: { type: String, default: '' },
  fileName: { type: String, default: '' },
  uploadedBy: { type: String },
  uploadedAt: { type: Date, default: Date.now }
});

labResultSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('LabResult', labResultSchema);
