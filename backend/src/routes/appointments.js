const express = require('express');
const { readDb, writeDb, uid } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = readDb();
  let appointments = db.appointments;

  if (req.user.role === 'hospital') {
    appointments = appointments.filter((a) => a.hospitalName === req.user.organization);
  }

  res.json(appointments.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
});

router.post('/', auth, requireRole('admin', 'hospital', 'clinic'), (req, res) => {
  const { patientId, doctorName, hospitalName, type, date, time } = req.body;
  if (!patientId || !date || !time) {
    return res.status(400).json({ error: 'Patient, date, and time are required' });
  }

  const db = readDb();
  const patient = db.patients.find((p) => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const appointment = {
    id: uid(),
    referralId: null,
    patientId,
    patientName: patient.name,
    doctorName: doctorName || req.user.name,
    hospitalName: hospitalName || req.user.organization,
    type: type || 'General Checkup',
    date,
    time,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  db.appointments.push(appointment);
  writeDb(db);
  res.status(201).json(appointment);
});

router.patch('/:id/status', auth, requireRole('admin', 'hospital', 'clinic'), (req, res) => {
  const { status } = req.body;
  const db = readDb();
  const appointment = db.appointments.find((a) => a.id === req.params.id);

  if (!appointment) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  appointment.status = status || appointment.status;
  writeDb(db);
  res.json(appointment);
});

module.exports = router;
