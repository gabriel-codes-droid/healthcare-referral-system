const express = require('express');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Referral = require('../models/Referral');
const Appointment = require('../models/Appointment');
const LabTest = require('../models/LabTest');
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const { audit } = require('../services/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find();
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});
router.post('/', auth, requireRole('admin'), async (req, res) => { try { const hospital = await Hospital.create(req.body); audit(req, 'facility.created', 'Hospital', hospital._id); res.status(201).json(hospital); } catch { res.status(400).json({ error: 'Name, type and location are required' }); } });
router.patch('/:id', auth, requireRole('admin'), async (req, res) => { const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!hospital) return res.status(404).json({ error: 'Facility not found' }); audit(req, 'facility.updated', 'Hospital', hospital._id); res.json(hospital); });
router.delete('/:id', auth, requireRole('admin'), async (req, res) => { const hospital = await Hospital.findByIdAndDelete(req.params.id); if (!hospital) return res.status(404).json({ error: 'Facility not found' }); await Doctor.deleteMany({ hospitalId: hospital._id }); audit(req, 'facility.deleted', 'Hospital', hospital._id); res.status(204).end(); });

router.get('/doctors', auth, async (req, res) => {
  try {
    const doctors = await Doctor.find().populate('hospitalId');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});
router.post('/doctors', auth, requireRole('admin', 'hospital'), async (req, res) => { try { const doctor = await Doctor.create(req.body); audit(req, 'doctor.created', 'Doctor', doctor._id); res.status(201).json(doctor); } catch { res.status(400).json({ error: 'Name and specialty are required' }); } });
router.patch('/doctors/:id', auth, requireRole('admin', 'hospital'), async (req, res) => { const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!doctor) return res.status(404).json({ error: 'Doctor not found' }); audit(req, 'doctor.updated', 'Doctor', doctor._id); res.json(doctor); });
router.delete('/doctors/:id', auth, requireRole('admin', 'hospital'), async (req, res) => { const doctor = await Doctor.findByIdAndDelete(req.params.id); if (!doctor) return res.status(404).json({ error: 'Doctor not found' }); audit(req, 'doctor.deleted', 'Doctor', doctor._id); res.status(204).end(); });

router.get('/stats', auth, async (req, res) => {
  try {
    let patientQuery = {};
    let referrals = await Referral.find();
    let appointments = await Appointment.find();
    let labTests = await LabTest.find();
    if (req.user.role === 'clinic') {
      referrals = referrals.filter((r) => r.fromOrganization === req.user.organization);
      appointments = appointments.filter((a) => a.hospitalName === req.user.organization);
    } else if (req.user.role === 'hospital') {
      referrals = referrals.filter((r) => r.toOrganization === req.user.organization);
      appointments = appointments.filter((a) => a.hospitalName === req.user.organization);
    } else if (req.user.role === 'lab') {
      labTests = labTests.filter((t) => t.requestedBy === req.user.organization || !t.requestedBy);
      referrals = [];
      appointments = [];
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ email: req.user.email });
      patientQuery = patient ? { _id: patient._id } : { _id: null };
      referrals = patient ? referrals.filter((r) => r.patientId.toString() === patient._id.toString()) : [];
      appointments = patient ? appointments.filter((a) => a.patientId.toString() === patient._id.toString()) : [];
      labTests = patient ? labTests.filter((t) => t.patientId.toString() === patient._id.toString()) : [];
    }
    const patients = await Patient.countDocuments(patientQuery);

    const statusCounts = {
      pending: referrals.filter((r) => r.status === 'pending').length,
      accepted: referrals.filter((r) => r.status === 'accepted').length,
      rejected: referrals.filter((r) => r.status === 'rejected').length,
      completed: referrals.filter((r) => r.status === 'completed').length
    };

    const recentReferrals = referrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
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
