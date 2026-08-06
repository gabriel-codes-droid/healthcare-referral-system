const express = require('express');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const { auth, requireRole } = require('../middleware/auth');
const { audit } = require('../services/audit');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const patients = req.user.role === 'patient' ? await Patient.find({ email: req.user.email }) : await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    if (req.user.role === 'patient' && patient.email !== req.user.email) return res.status(403).json({ error: 'You can only access your own record' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

router.patch('/:id', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  try { const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!patient) return res.status(404).json({ error: 'Patient not found' }); audit(req, 'patient.updated', 'Patient', patient._id); res.json(patient); } catch { res.status(400).json({ error: 'Failed to update patient' }); }
});

router.post('/', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { name, email, phone, dateOfBirth, gender, address } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  try {
    const patient = new Patient({
      name,
      email,
      phone,
      dateOfBirth: dateOfBirth || '',
      gender: gender || '',
      address: address || '',
      avatar: `https://i.pravatar.cc/80?u=${encodeURIComponent(email)}`
    });

    await patient.save();
    audit(req, 'patient.created', 'Patient', patient._id);
    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient' });
  }
});

router.post('/:id/visit', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { chiefComplaint, diagnosis, notes, referralNeeded } = req.body;
  
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const visit = await Visit.create({ patientId: patient._id, clinicianId: req.user.id, clinicianName: req.user.name, organization: req.user.organization, chiefComplaint, diagnosis, notes, referralNeeded: Boolean(referralNeeded) });
    audit(req, 'visit.created', 'Patient', patient._id);
    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

router.get('/:id/visits', auth, async (req, res) => {
  if (req.user.role === 'patient') { const patient = await Patient.findById(req.params.id); if (!patient || patient.email !== req.user.email) return res.status(403).json({ error: 'You can only access your own record' }); }
  res.json(await Visit.find({ patientId: req.params.id }).sort({ visitedAt: -1 }));
});

router.post('/:id/medical-history', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const patient = await Patient.findById(req.params.id); if (!patient) return res.status(404).json({ error: 'Patient not found' });
  patient.medicalHistory.push(req.body); await patient.save(); audit(req, 'medical_history.added', 'Patient', patient._id); res.status(201).json(patient);
});
router.post('/:id/allergies', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const patient = await Patient.findById(req.params.id); if (!patient) return res.status(404).json({ error: 'Patient not found' });
  patient.allergies.push(req.body); await patient.save(); audit(req, 'allergy.added', 'Patient', patient._id); res.status(201).json(patient);
});
router.post('/:id/prescriptions', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const patient = await Patient.findById(req.params.id); if (!patient) return res.status(404).json({ error: 'Patient not found' });
  patient.prescriptions.push(req.body); await patient.save(); audit(req, 'prescription.added', 'Patient', patient._id); res.status(201).json(patient);
});
router.post('/:id/attachments', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { name, url, mimeType } = req.body; if (!name || !url) return res.status(400).json({ error: 'Attachment name and URL are required' });
  const patient = await Patient.findById(req.params.id); if (!patient) return res.status(404).json({ error: 'Patient not found' });
  patient.attachments.push({ name, url, mimeType }); await patient.save(); audit(req, 'attachment.added', 'Patient', patient._id); res.status(201).json(patient);
});

module.exports = router;
