const express = require('express');
const Patient = require('../models/Patient');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find();
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
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
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

    // For now, we'll skip visit creation as it needs a separate model
    // This would need a Visit model to be fully functional with MongoDB
    res.status(501).json({ error: 'Visit functionality not yet migrated to MongoDB' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

router.get('/:id/visits', auth, async (req, res) => {
  // This would need a Visit model to be fully functional with MongoDB
  res.status(501).json({ error: 'Visit functionality not yet migrated to MongoDB' });
});

module.exports = router;
