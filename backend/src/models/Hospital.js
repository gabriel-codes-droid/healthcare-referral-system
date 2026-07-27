const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['hospital', 'clinic', 'laboratory'], required: true },
  location: { type: String, required: }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
