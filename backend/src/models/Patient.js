const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  address: { type: String },
  allergies: { type: [String], default: [] },
  avatar: { type: String },
  registeredAt: { type: Date, default: Date.now }
});

patientSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Patient', patientSchema);
