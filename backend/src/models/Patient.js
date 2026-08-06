const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  address: { type: String },
  avatar: { type: String },
  medicalHistory: [{ condition: String, diagnosedOn: Date, notes: String }],
  allergies: [{ substance: String, reaction: String, severity: String }],
  prescriptions: [{ medication: String, dosage: String, instructions: String, prescribedOn: { type: Date, default: Date.now } }],
  attachments: [{ name: String, url: String, mimeType: String, uploadedAt: { type: Date, default: Date.now } }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
