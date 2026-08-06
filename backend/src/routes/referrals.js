const express = require('express');
const Referral = require('../models/Referral');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { auth, requireRole } = require('../middleware/auth');
const { audit } = require('../services/audit');

const router = express.Router();

async function formatReferral(referral) {
  const patient = await Patient.findById(referral.patientId);
  return {
    ...referral.toObject(),
    patientAvatar: patient?.avatar || ''
  };
}

router.get('/', auth, async (req, res) => {
  try {
    let referrals = await Referral.find();

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ email: req.user.email });
      referrals = patient ? referrals.filter((r) => r.patientId.toString() === patient._id.toString()) : [];
    } else if (req.user.role === 'clinic') {
      referrals = referrals.filter((r) => r.fromOrganization === req.user.organization);
    } else if (req.user.role === 'hospital') {
      referrals = referrals.filter((r) => r.toOrganization === req.user.organization);
    }

    const formattedReferrals = await Promise.all(referrals.map(formatReferral));
    res.json(formattedReferrals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id);
    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    res.json(await formatReferral(referral));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referral' });
  }
});

router.post('/', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { patientId, toOrganization, assignedDoctorId, reason, priority, notes } = req.body;
  if (!patientId || !toOrganization || !reason) {
    return res.status(400).json({ error: 'Patient, destination hospital, and reason are required' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const doctor = assignedDoctorId ? await Doctor.findById(assignedDoctorId) : null;
    if (assignedDoctorId && !doctor) return res.status(404).json({ error: 'Specialist not found' });
    const referral = new Referral({
      patientId,
      patientName: patient.name,
      patientAvatar: patient.avatar,
      fromOrganization: req.user.organization,
      toOrganization,
      assignedDoctorId: doctor?._id,
      assignedDoctorName: doctor?.name || '',
      reason,
      priority: priority || 'normal',
      notes: notes || ''
    });

    await referral.save();
    audit(req, 'referral.created', 'Referral', referral._id, `To ${toOrganization}`);
    res.status(201).json(await formatReferral(referral));
  } catch (error) {
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

router.patch('/:id/accept', auth, requireRole('admin', 'hospital'), async (req, res) => {
  const { appointmentDate, appointmentTime, assignedDoctor, assignedDoctorId } = req.body;

  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    if (referral.status !== 'pending') {
      return res.status(400).json({ error: `Referral is already ${referral.status}` });
    }
    if (req.user.role === 'hospital' && referral.toOrganization !== req.user.organization) {
      return res.status(403).json({ error: 'This referral is not for your hospital' });
    }

    const doctor = assignedDoctorId ? await Doctor.findById(assignedDoctorId) : null;
    referral.status = 'accepted';
    if (doctor) { referral.assignedDoctorId = doctor._id; referral.assignedDoctorName = doctor.name; }
    referral.updatedAt = new Date();

    const appointment = new Appointment({
      patientId: referral.patientId,
      patientName: referral.patientName,
      doctorId: doctor?._id || referral.assignedDoctorId,
      doctorName: assignedDoctor || doctor?.name || referral.assignedDoctorName || req.user.name,
      hospitalName: referral.toOrganization,
      type: referral.reason,
      date: appointmentDate || new Date().toISOString().split('T')[0],
      time: appointmentTime || '10:00 AM',
      status: 'scheduled'
    });

    await appointment.save();
    referral.appointmentId = appointment._id;
    await referral.save();
    audit(req, 'referral.accepted', 'Referral', referral._id);

    res.json({
      referral: await formatReferral(referral),
      appointment
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept referral' });
  }
});

router.patch('/:id/reject', auth, requireRole('admin', 'hospital'), async (req, res) => {
  const { rejectionReason } = req.body;

  try {
    const referral = await Referral.findById(req.params.id);

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
    referral.rejectionReason = rejectionReason || 'Not accepted at this time';
    referral.updatedAt = new Date();
    await referral.save();
    audit(req, 'referral.rejected', 'Referral', referral._id);

    res.json(await formatReferral(referral));
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject referral' });
  }
});

router.patch('/:id/complete', auth, requireRole('admin', 'hospital', 'clinic'), async (req, res) => {
  const { treatmentNotes } = req.body;

  try {
    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    if (referral.status !== 'accepted') {
      return res.status(400).json({ error: 'Only accepted referrals can be completed' });
    }

    referral.status = 'completed';
    referral.treatmentNotes = treatmentNotes || '';
    referral.updatedAt = new Date();
    await referral.save();
    audit(req, 'referral.completed', 'Referral', referral._id);

    res.json(await formatReferral(referral));
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete referral' });
  }
});

module.exports = router;
