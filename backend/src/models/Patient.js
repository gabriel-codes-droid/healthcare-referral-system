const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  address: { type: String },
  avatar: { type: String },
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Patient', patientSchema);
