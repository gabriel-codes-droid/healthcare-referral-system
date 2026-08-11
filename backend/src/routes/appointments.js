const express = require('express');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const WORK_START_MIN = 9 * 60; // 09:00
const WORK_END_MIN = 17 * 60; // 17:00
const SLOT_MINUTES = 30;

function generateDaySlots() {
  const slots = [];
  for (let mins = WORK_START_MIN; mins < WORK_END_MIN; mins += SLOT_MINUTES) {
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

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

router.get('/availability', auth, async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    return res.status(400).json({ error: 'doctorId and date are required' });
  }

  try {
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    const booked = await Appointment.find({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'cancelled' }
    });
    const bookedTimes = new Set(booked.map((a) => a.time));

    const slots = generateDaySlots().map((time) => ({ time, available: !bookedTimes.has(time) }));
    res.json({ date, doctorId, slots });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
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

    let resolvedDoctorName = doctorName || req.user.name;
    if (doctorId) {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ error: 'Doctor not found' });
      }
      resolvedDoctorName = doctor.name;

      const conflict = await Appointment.findOne({
        doctorId,
        date: new Date(date),
        time,
        status: { $ne: 'cancelled' }
      });
      if (conflict) {
        return res.status(409).json({ error: 'This doctor is already booked for that time slot' });
      }
    }

    const appointment = new Appointment({
      patientId,
      patientName: patient.name,
      doctorId: doctorId || undefined,
      doctorName: resolvedDoctorName,
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
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message || 'Failed to update appointment' });
  }
});

module.exports = router;
