const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['hospital', 'clinic', 'laboratory'], required: true },
  location: { type: String, required: true},
});

hospitalSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Hospital', hospitalSchema);
