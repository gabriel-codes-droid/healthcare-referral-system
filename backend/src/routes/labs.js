const express = require('express');
const LabTest = require('../models/LabTest');
const LabResult = require('../models/LabResult');
const Patient = require('../models/Patient');
const { auth, requireRole } = require('../middleware/auth');
const { audit } = require('../services/audit');

const router = express.Router();

router.get('/tests', auth, async (req, res) => {
  try {
    let tests = await LabTest.find();

    if (req.user.role === 'lab') {
      tests = tests.filter((t) => t.requestedBy === req.user.organization || !t.requestedBy);
    } else if (req.user.role === 'clinic' || req.user.role === 'hospital') {
      tests = tests.filter((t) => t.requestedBy === req.user.organization);
    }

    const enriched = await Promise.all(tests.map(async (test) => {
      const results = await LabResult.find({ labTestId: test._id });
      return { ...test.toObject(), results };
    }));

    res.json(enriched.sort((a, b) => new Date(b.requestedDate) - new Date(a.requestedDate)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch lab tests' });
  }
});

router.post('/tests', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { patientId, testType, notes } = req.body;
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
      testType,
      requestedBy: req.user.name,
      status: 'pending',
      notes: notes || ''
    });

    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lab test' });
  }
});

router.post('/results', auth, requireRole('admin', 'lab'), async (req, res) => {
  const { labTestId, results, normalRange, status } = req.body;
  if (!labTestId || !results) {
    return res.status(400).json({ error: 'Lab test ID and results are required' });
  }

  try {
    const test = await LabTest.findById(labTestId);
    if (!test) {
      return res.status(404).json({ error: 'Lab test not found' });
    }

    const result = new LabResult({
      labTestId,
      patientId: test.patientId,
      testType: test.testType,
      results,
      normalRange: normalRange || '',
      status: status || 'normal',
      completedBy: req.user.name
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

router.patch('/tests/:id', auth, requireRole('admin', 'lab'), async (req, res) => {
  const test = await LabTest.findById(req.params.id);
  if (!test) return res.status(404).json({ error: 'Lab test not found' });
  if (req.user.role === 'lab' && test.requestedBy !== req.user.organization && test.requestedBy !== req.user.name) return res.status(403).json({ error: 'This test is not assigned to your laboratory' });
  if (req.body.status) test.status = req.body.status;
  if (req.body.notes !== undefined) test.notes = req.body.notes;
  await test.save(); audit(req, 'lab_test.updated', 'LabTest', test._id, test.status); res.json(test);
});

router.delete('/tests/:id', auth, requireRole('admin'), async (req, res) => {
  const test = await LabTest.findByIdAndDelete(req.params.id);
  if (!test) return res.status(404).json({ error: 'Lab test not found' });
  await LabResult.deleteMany({ labTestId: test._id }); audit(req, 'lab_test.deleted', 'LabTest', test._id); res.status(204).end();
});

module.exports = router;
