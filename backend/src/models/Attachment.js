const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

// Small clinical documents/images stored inline as base64. Fine for scanned
// referral letters, lab reports, and similar (this is capped server-side at
// ATTACHMENT_MAX_BYTES in routes/patients.js). If large files (video, full
// imaging studies) become a real need later, swap `data` for a pointer to
// object storage (S3/R2/GridFS) instead of growing this further.
const attachmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  fileName: { type: String, required: true },
  mimeType: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  data: { type: String, required: true }, // base64
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

attachmentSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Attachment', attachmentSchema);
