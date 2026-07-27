const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  rating: { type: Number, default: 0 },
  avatar: { type: String },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }
});

module.exports = mongoose.model('Doctor', doctorSchema);
