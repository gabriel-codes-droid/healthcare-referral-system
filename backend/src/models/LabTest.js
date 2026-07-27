const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  testType: { type: String, required: true },
  requestedBy: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  requestedDate: { type: Date, default: Date.now },
  completedDate: { type: Date }
});

module.exports = mongoose.model('LabTest', labTestSchema);
