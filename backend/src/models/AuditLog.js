const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const auditLogSchema = new mongoose.Schema({
  userId: { type: String },
  userName: { type: String, required: true },
  userOrg: { type: String },
  userRole: { type: String },
  action: { type: String, required: true }, // e.g. 'login', 'patient.export', 'patient.delete'
  targetType: { type: String }, // e.g. 'Patient', 'User'
  targetId: { type: String },
  details: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

auditLogSchema.plugin(toJSONPlugin);
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
