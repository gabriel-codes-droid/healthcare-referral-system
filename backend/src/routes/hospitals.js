const express = require('express');
const { readDb } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, (req, res) => {
  const db = readDb();
  res.json(db.hospitals);
});

router.get('/doctors', auth, (req, res) => {
  const db = readDb();
  res.json(db.doctors);
});

router.get('/stats', auth, (req, res) => {
  const db = readDb();
  const referrals = db.referrals;
  const appointments = db.appointments;
  const labTests = db.labTests;

  const statusCounts = {
    pending: referrals.filter((r) => r.status === 'pending').length,
    accepted: referrals.filter((r) => r.status === 'accepted').length,
    rejected: referrals.filter((r) => r.status === 'rejected').length,
    cancelled: referrals.filter((r) => r.status === 'cancelled').length,
    completed: referrals.filter((r) => r.status === 'completed').length
  };

  res.json({
    totalPatients: db.patients.length,
    totalReferrals: referrals.length,
    totalAppointments: appointments.length,
    labsCompleted: labTests.filter((t) => t.status === 'completed').length,
    referralStatus: statusCounts,
    recentReferrals: referrals.slice(-5).reverse(),
    upcomingAppointments: appointments.filter((a) => a.status === 'confirmed').slice(0, 5),
    topDoctors: db.doctors.sort((a, b) => b.rating - a.rating).slice(0, 4)
  });
});

module.exports = router;
