const express = require('express');
const { readDb, writeDb, uid } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

function formatReferral(referral, db) {
  const patient = db.patients.find((p) => p.id === referral.patientId);
  return {
    ...referral,
    patientAvatar: patient?.avatar || ''
  };
}

router.get('/', auth, (req, res) => {
  const db = readDb();
  let referrals = db.referrals;

  if (req.user.role === 'clinic') {
    referrals = referrals.filter((r) => r.fromOrganization === req.user.organization);
  } else if (req.user.role === 'hospital') {
    referrals = referrals.filter((r) => r.toOrganization === req.user.organization);
  }

  res.json(referrals.map((r) => formatReferral(r, db)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

router.get('/:id', auth, (req, res) => {
  const db = readDb();
  const referral = db.referrals.find((r) => r.id === req.params.id);
  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }
  res.json(formatReferral(referral, db));
});

router.post('/', auth, requireRole('admin', 'clinic', 'hospital'), (req, res) => {
  const { patientId, toOrganization, reason, priority, visitId, notes } = req.body;
  if (!patientId || !toOrganization || !reason) {
    return res.status(400).json({ error: 'Patient, destination hospital, and reason are required' });
  }

  const db = readDb();
  const patient = db.patients.find((p) => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const referral = {
    id: uid(),
    patientId,
    patientName: patient.name,
    fromOrganization: req.user.organization,
    toOrganization,
    reason,
    priority: priority || 'normal',
    status: 'pending',
    visitId: visitId || null,
    notes: notes || '',
    createdBy: req.user.id,
    createdByName: req.user.name,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    completedAt: null
  };

  db.referrals.push(referral);
  writeDb(db);
  res.status(201).json(formatReferral(referral, db));
});

router.patch('/:id/accept', auth, requireRole('admin', 'hospital'), (req, res) => {
  const { appointmentDate, appointmentTime, assignedDoctor } = req.body;
  const db = readDb();
  const referral = db.referrals.find((r) => r.id === req.params.id);

  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }
  if (referral.status !== 'pending') {
    return res.status(400).json({ error: `Referral is already ${referral.status}` });
  }
  if (req.user.role === 'hospital' && referral.toOrganization !== req.user.organization) {
    return res.status(403).json({ error: 'This referral is not for your hospital' });
  }

  referral.status = 'accepted';
  referral.reviewedAt = new Date().toISOString();
  referral.reviewedBy = req.user.name;

  const appointment = {
    id: uid(),
    referralId: referral.id,
    patientId: referral.patientId,
    patientName: referral.patientName,
    doctorName: assignedDoctor || req.user.name,
    hospitalName: referral.toOrganization,
    type: referral.reason,
    date: appointmentDate || new Date().toISOString().split('T')[0],
    time: appointmentTime || '10:00 AM',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  db.appointments.push(appointment);
  referral.appointmentId = appointment.id;
  writeDb(db);

  res.json({
    referral: formatReferral(referral, db),
    appointment
  });
});

router.patch('/:id/reject', auth, requireRole('admin', 'hospital'), (req, res) => {
  const { rejectionReason } = req.body;
  const db = readDb();
  const referral = db.referrals.find((r) => r.id === req.params.id);

  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }
  if (referral.status !== 'pending') {
    return res.status(400).json({ error: `Referral is already ${referral.status}` });
  }
  if (req.user.role === 'hospital' && referral.toOrganization !== req.user.organization) {
    return res.status(403).json({ error: 'This referral is not for your hospital' });
  }

  referral.status = 'rejected';
  referral.reviewedAt = new Date().toISOString();
  referral.reviewedBy = req.user.name;
  referral.rejectionReason = rejectionReason || 'Not accepted at this time';
  writeDb(db);

  res.json(formatReferral(referral, db));
});

router.patch('/:id/cancel', auth, requireRole('admin', 'clinic'), (req, res) => {
  const db = readDb();
  const referral = db.referrals.find((r) => r.id === req.params.id);

  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }
  if (!['pending', 'accepted'].includes(referral.status)) {
    return res.status(400).json({ error: `Cannot cancel a ${referral.status} referral` });
  }

  referral.status = 'cancelled';
  referral.reviewedAt = new Date().toISOString();
  writeDb(db);

  res.json(formatReferral(referral, db));
});

router.patch('/:id/complete', auth, requireRole('admin', 'hospital', 'clinic'), (req, res) => {
  const { treatmentNotes } = req.body;
  const db = readDb();
  const referral = db.referrals.find((r) => r.id === req.params.id);

  if (!referral) {
    return res.status(404).json({ error: 'Referral not found' });
  }
  if (referral.status !== 'accepted') {
    return res.status(400).json({ error: 'Only accepted referrals can be completed' });
  }

  referral.status = 'completed';
  referral.completedAt = new Date().toISOString();
  referral.treatmentNotes = treatmentNotes || '';
  writeDb(db);

  res.json(formatReferral(referral, db));
});

module.exports = router;
