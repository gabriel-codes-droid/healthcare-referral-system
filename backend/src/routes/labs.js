const express = require('express');
const LabTest = require('../models/LabTest');
const LabResult = require('../models/LabResult');
const Patient = require('../models/Patient');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/tests', auth, async (req, res) => {
  try {
    let tests = await LabTest.find();

    if (req.user.role === 'lab') {
      tests = tests.filter((t) => t.labName === req.user.organization || !t.labName);
    } else if (req.user.role === 'clinic' || req.user.role === 'hospital') {
      tests = tests.filter((t) => t.requestedByOrg === req.user.organization);
    }

    const enriched = await Promise.all(tests.map(async (test) => {
      const results = await LabResult.find({ labTestId: test._id });
      return { ...test.toJSON(), results };
    }));

    res.json(enriched.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
});

router.post('/tests', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { patientId, testType, labName, notes, referralId } = req.body;
  if (!patientId || !testType) {
    return res.status(400).json({ error: 'Patient and test type are required' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const test = new LabTest({
      patientId,
      patientName: patient.name,
      referralId: referralId || null,
      testType,
      labName: labName || '',
      requestedBy: req.user.name,
      requestedByOrg: req.user.organization,
      status: 'pending',
      notes: notes || ''
    });

    await test.save();
    res.status(201).json({ ...test.toJSON(), results: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lab test' });
  }
});

router.post('/results', auth, requireRole('admin', 'lab'), async (req, res) => {
  const { labTestId, findings, summary, fileName } = req.body;
  if (!labTestId || !findings) {
    return res.status(400).json({ error: 'Lab test ID and findings are required' });
  }

  try {
    const test = await LabTest.findById(labTestId);
    if (!test) {
      return res.status(404).json({ error: 'Lab test not found' });
    }

    const result = new LabResult({
      labTestId,
      patientId: test.patientId,
      patientName: test.patientName,
      testType: test.testType,
      findings,
      summary: summary || '',
      fileName: fileName || '',
      uploadedBy: req.user.name
    });

    test.status = 'completed';
    test.completedDate = new Date();

    await result.save();
    await test.save();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload lab result' });
  }
});

module.exports = router;
