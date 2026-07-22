const express = require('express');
const { readDb, writeDb, uid } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = readDb();
  res.json(db.patients);
});

router.get('/:id', auth, (req, res) => {
  const db = readDb();
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }
  res.json(patient);
});

router.post('/', auth, requireRole('admin', 'clinic', 'hospital'), (req, res) => {
  const { name, email, phone, dateOfBirth, gender, address } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  const db = readDb();
  const patient = {
    id: uid(),
    name,
    email,
    phone,
    dateOfBirth: dateOfBirth || '',
    gender: gender || '',
    address: address || '',
    avatar: `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`,
    registeredAt: new Date().toISOString()
  };

  db.patients.push(patient);
  writeDb(db);
  res.status(201).json(patient);
});

router.post('/:id/visit', auth, requireRole('admin', 'clinic', 'hospital'), (req, res) => {
  const { chiefComplaint, diagnosis, notes, referralNeeded } = req.body;
  const db = readDb();
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const visit = {
    id: uid(),
    patientId: patient.id,
    patientName: patient.name,
    doctorId: req.user.id,
    doctorName: req.user.name,
    clinicName: req.user.organization,
    chiefComplaint: chiefComplaint || '',
    diagnosis: diagnosis || '',
    notes: notes || '',
    referralNeeded: Boolean(referralNeeded),
    visitedAt: new Date().toISOString()
  };

  db.visits.push(visit);
  writeDb(db);
  res.status(201).json(visit);
});

router.get('/:id/visits', auth, (req, res) => {
  const db = readDb();
  const visits = db.visits.filter((v) => v.patientId === req.params.id);
  res.json(visits);
});

module.exports = router;
