const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { auth, requireRole } = require('../middleware/auth');
const { audit } = require('../services/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let appointments = await Appointment.find();

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ email: req.user.email });
      appointments = patient ? appointments.filter((a) => a.patientId.toString() === patient._id.toString()) : [];
    } else if (req.user.role === 'hospital') {
      appointments = appointments.filter((a) => a.hospitalName === req.user.organization);
    }

    res.json(appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

router.get('/availability', auth, async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) return res.status(400).json({ error: 'Doctor and date are required' });
  const [booked, doctor] = await Promise.all([Appointment.find({ doctorId, date: new Date(date), status: 'scheduled' }).select('time'), Doctor.findById(doctorId)]);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date(`${date}T12:00:00`));
  const configured = doctor.availability?.find((entry) => entry.day === weekday)?.slots;
  const slots = configured?.length ? configured : ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
  res.json({ slots: slots.filter((slot) => !booked.some((a) => a.time === slot)), booked: booked.map((a) => a.time) });
});

router.post('/', auth, requireRole('admin', 'hospital', 'clinic'), async (req, res) => {
  const { patientId, doctorId, doctorName, hospitalName, type, date, time } = req.body;
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
      doctorId: doctorId || undefined,
      doctorName: doctorName || req.user.name,
      hospitalName: hospitalName || req.user.organization,
      type: type || 'consultation',
      date,
      time,
      status: 'scheduled'
    });

    await appointment.save();
    audit(req, 'appointment.created', 'Appointment', appointment._id);
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
    audit(req, 'appointment.status_updated', 'Appointment', appointment._id, appointment.status);
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

module.exports = router;
