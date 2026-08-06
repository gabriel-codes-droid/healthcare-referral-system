const express = require('express');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Referral = require('../models/Referral');
const { auth, requireRole } = require('../middleware/auth');
const { audit } = require('../services/audit');
const router = express.Router();
router.get('/audit-logs', auth, requireRole('admin'), async (_req, res) => res.json(await require('../models/AuditLog').find().sort({ createdAt: -1 }).limit(200)));
router.get('/patients/:id/export', auth, async (req, res) => {
  const patient = await Patient.findById(req.params.id); if (!patient) return res.status(404).json({ error: 'Patient not found' });
  const [visits, referrals] = await Promise.all([Visit.find({ patientId: patient._id }), Referral.find({ patientId: patient._id })]);
  audit(req, 'patient.exported', 'Patient', patient._id);
  res.json({ exportedAt: new Date(), patient, visits, referrals });
});
router.delete('/patients/:id', auth, requireRole('admin'), async (req, res) => { const patient = await Patient.findByIdAndDelete(req.params.id); if (!patient) return res.status(404).json({ error: 'Patient not found' }); audit(req, 'patient.deleted', 'Patient', patient._id); res.status(204).end(); });
module.exports = router;
