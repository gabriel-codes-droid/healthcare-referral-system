const AuditLog = require('../models/AuditLog');
exports.audit = (req, action, entityType, entityId, details = '') =>
  AuditLog.create({ actorId: req.user?.id, actorName: req.user?.name, action, entityType, entityId: String(entityId || ''), details }).catch(() => {});
