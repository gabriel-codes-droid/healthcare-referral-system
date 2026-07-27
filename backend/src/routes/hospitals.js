const express = require('express');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Referral = require('../models/Referral');
const Appointment = require('../models/Appointment');
const LabTest = require('../models/LabTest');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospitals' });
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
