const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let appointments = await Appointment.find();

    if (req.user.role === 'hospital') {
      appointments = appointments.filter((a) => a.hospitalName === req.user.organization);
    }

    res.json(appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.post('/', auth, requireRole('admin', 'hospital', 'clinic'), async (req, res) => {
  const { patientId, doctorName, hospitalName, type, date, time } = req.body;
  if (!patientId || !date || !time) {
    return res.status(400).json({ error: 'Patient, date, and time are required' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const appointment = new Appointment({
      patientId,
      patientName: patient.name,
      doctorName: doctorName || req.user.name,
      hospitalName: hospitalName || req.user.organization,
      type: type || 'consultation',
      date,
      time,
      status: 'scheduled'
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

router.patch('/:id/status', auth, requireRole('admin', 'hospital', 'clinic'), async (req, res) => {
  const { status } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    appointment.status = status || appointment.status;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

module.exports = router;
