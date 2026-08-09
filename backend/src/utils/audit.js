const AuditLog = require('../models/AuditLog');

// Fire-and-forget: audit logging must never break the request it's
// documenting. Failures are logged to the server console only.
function logAudit(req, action, targetType, targetId, details = '') {
  const entry = new AuditLog({
    userId: req.user?.id,
    userName: req.user?.name || 'unknown',
    userOrg: req.user?.organization,
    userRole: req.user?.role,
    action,
    targetType,
    targetId: targetId ? String(targetId) : undefined,
    details
  });

  entry.save().catch((error) => {
    console.error('Failed to write audit log:', error.message);
  });
}

module.exports = { logAudit };
