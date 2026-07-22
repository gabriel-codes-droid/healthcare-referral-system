const express = require('express');
const { readDb, writeDb, uid } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/tests', auth, (req, res) => {
  const db = readDb();
  let tests = db.labTests;

  if (req.user.role === 'lab') {
    tests = tests.filter((t) => t.labName === req.user.organization || !t.labName);
  } else if (req.user.role === 'clinic' || req.user.role === 'hospital') {
    tests = tests.filter((t) => t.requestedByOrg === req.user.organization);
  }

  const enriched = tests.map((test) => {
    const results = db.labResults.filter((r) => r.labTestId === test.id);
    return { ...test, results };
  });

  res.json(enriched.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)));
});

router.post('/tests', auth, requireRole('admin', 'clinic', 'hospital'), (req, res) => {
  const { patientId, testType, referralId, labName, notes } = req.body;
  if (!patientId || !testType) {
    return res.status(400).json({ error: 'Patient and test type are required' });
  }

  const db = readDb();
  const patient = db.patients.find((p) => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const test = {
    id: uid(),
    patientId,
    patientName: patient.name,
    referralId: referralId || null,
    testType,
    labName: labName || 'Metro Laboratory',
    requestedBy: req.user.name,
    requestedByOrg: req.user.organization,
    status: 'pending',
    notes: notes || '',
    requestedAt: new Date().toISOString()
  };

  db.labTests.push(test);
  writeDb(db);
  res.status(201).json(test);
});

router.post('/results', auth, requireRole('admin', 'lab'), (req, res) => {
  const { labTestId, findings, summary, fileName } = req.body;
  if (!labTestId || !findings) {
    return res.status(400).json({ error: 'Lab test ID and findings are required' });
  }

  const db = readDb();
  const test = db.labTests.find((t) => t.id === labTestId);
  if (!test) {
    return res.status(404).json({ error: 'Lab test not found' });
  }

  const result = {
    id: uid(),
    labTestId,
    patientId: test.patientId,
    patientName: test.patientName,
    testType: test.testType,
    findings,
    summary: summary || '',
    fileName: fileName || 'results.pdf',
    uploadedBy: req.user.name,
    uploadedAt: new Date().toISOString()
  };

  test.status = 'completed';
  db.labResults.push(result);
  writeDb(db);
  res.status(201).json(result);
});

module.exports = router;
