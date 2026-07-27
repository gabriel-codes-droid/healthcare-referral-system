const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  labTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTest', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  testType: { type: String, required: true },
  results: { type: String, required: true },
  normalRange: { type: String },
  status: { type: String, enum: ['normal', 'abnormal', 'critical'], default: 'normal' },
  completedBy: { type: String },
  completedDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LabResult', labResultSchema);
