const express = require('express');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Referral = require('../models/Referral');
const Appointment = require('../models/Appointment');
const LabTest = require('../models/LabTest');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { name, type, location } = req.body;
  if (!name || !type || !location) {
    return res.status(400).json({ error: 'Name, type, and location are required' });
  }

  try {
    const hospital = new Hospital({ name, type, location });
    await hospital.save();
    res.status(201).json(hospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create hospital' });
  }
});

router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  const { name, type, location } = req.body;

  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    if (name) hospital.name = name;
    if (type) hospital.type = type;
    if (location) hospital.location = location;

    await hospital.save();
    res.json(hospital);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hospital' });
  }
});

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }
    await Doctor.deleteMany({ hospitalId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete hospital' });
  }
});

router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('hospitalId');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.post('/doctors', auth, requireRole('admin'), async (req, res) => {
  const { name, specialty, hospitalId, avatar, rating } = req.body;
  if (!name || !specialty) {
    return res.status(400).json({ error: 'Name and specialty are required' });
  }

  try {
    if (hospitalId) {
      const hospital = await Hospital.findById(hospitalId);
      if (!hospital) {
        return res.status(404).json({ error: 'Hospital not found' });
      }
    }

    const doctor = new Doctor({
      name,
      specialty,
      hospitalId: hospitalId || undefined,
      avatar: avatar || `https://i.pravatar.cc/80?u=${encodeURIComponent(name)}`,
      rating: rating || 0
    });

    await doctor.save();
    res.status(201).json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create doctor' });
  }
});

router.patch('/doctors/:id', auth, requireRole('admin'), async (req, res) => {
  const { name, specialty, hospitalId, avatar, rating } = req.body;

  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (name) doctor.name = name;
    if (specialty) doctor.specialty = specialty;
    if (hospitalId !== undefined) doctor.hospitalId = hospitalId || undefined;
    if (avatar) doctor.avatar = avatar;
    if (rating !== undefined) doctor.rating = rating;

    await doctor.save();
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor' });
  }
});

router.delete('/doctors/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete doctor' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const patients = await Patient.countDocuments();
    const referrals = await Referral.find();
    const appointments = await Appointment.find();
    const labTests = await LabTest.find();

    const statusCounts = {
      pending: referrals.filter((r) => r.status === 'pending').length,
      accepted: referrals.filter((r) => r.status === 'accepted').length,
      rejected: referrals.filter((r) => r.status === 'rejected').length,
      completed: referrals.filter((r) => r.status === 'completed').length
    };

    const recentReferrals = await Referral.find().sort({ createdAt: -1 }).limit(5);
    const topDoctors = await Doctor.find().sort({ rating: -1 }).limit(4);

    res.json({
      totalPatients: patients,
      totalReferrals: referrals.length,
      totalAppointments: appointments.length,
      labsCompleted: labTests.filter((t) => t.status === 'completed').length,
      referralStatus: statusCounts,
      recentReferrals,
      upcomingAppointments: appointments.filter((a) => a.status === 'scheduled').slice(0, 5),
      topDoctors
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
