const express = require('express');
const Patient = require('../models/Patient');
const Visit = require('../models/Visit');
const Prescription = require('../models/Prescription');
const Attachment = require('../models/Attachment');
const Referral = require('../models/Referral');
const Appointment = require('../models/Appointment');
const LabTest = require('../models/LabTest');
const LabResult = require('../models/LabResult');
const Invoice = require('../models/Invoice');
const { auth, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');

const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5MB, pre-base64

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
    logAudit(req, 'patient.view', 'Patient', patient._id);
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

// GDPR/HIPAA data portability: a full export of everything the system
// holds on this patient, in one bundle.
router.get('/:id/export', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const [visits, prescriptions, attachments, referrals, appointments, labTests, invoices] = await Promise.all([
      Visit.find({ patientId: patient._id }),
      Prescription.find({ patientId: patient._id }),
      Attachment.find({ patientId: patient._id }).select('-data'),
      Referral.find({ patientId: patient._id }),
      Appointment.find({ patientId: patient._id }),
      LabTest.find({ patientId: patient._id }),
      Invoice.find({ patientId: patient._id })
    ]);

    logAudit(req, 'patient.export', 'Patient', patient._id);

    res.json({
      exportedAt: new Date().toISOString(),
      patient,
      visits,
      prescriptions,
      attachments,
      referrals,
      appointments,
      labTests,
      invoices
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export patient data' });
  }
});

// Right to erasure: removes the patient and every record tied to them.
// Admin-only and irreversible — matches the weight of the action.
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await Promise.all([
      Visit.deleteMany({ patientId: patient._id }),
      Prescription.deleteMany({ patientId: patient._id }),
      Attachment.deleteMany({ patientId: patient._id }),
      Referral.deleteMany({ patientId: patient._id }),
      Appointment.deleteMany({ patientId: patient._id }),
      LabTest.deleteMany({ patientId: patient._id }),
      Invoice.deleteMany({ patientId: patient._id })
    ]);
    await patient.deleteOne();

    logAudit(req, 'patient.delete', 'Patient', req.params.id, `Deleted patient ${patient.name} and all associated records`);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete patient' });
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

    const visit = new Visit({
      patientId: patient._id,
      patientName: patient.name,
      doctorId: req.user.id,
      doctorName: req.user.name,
      clinicName: req.user.organization,
      chiefComplaint: chiefComplaint || '',
      diagnosis: diagnosis || '',
      notes: notes || '',
      referralNeeded: Boolean(referralNeeded)
    });

    await visit.save();
    res.status(201).json(visit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

router.get('/:id/visits', auth, async (req, res) => {
  try {
    const visits = await Visit.find({ patientId: req.params.id }).sort({ visitedAt: -1 });
    res.json(visits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

router.patch('/:id/allergies', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { allergies } = req.body;
  if (!Array.isArray(allergies)) {
    return res.status(400).json({ error: 'allergies must be an array of strings' });
  }

  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    patient.allergies = allergies.map(String).map((a) => a.trim()).filter(Boolean);
    await patient.save();
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update allergies' });
  }
});

router.get('/:id/prescriptions', auth, async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.params.id }).sort({ prescribedAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

router.post('/:id/prescriptions', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  const { medication, dosage, frequency, duration, notes, visitId } = req.body;
  if (!medication || !dosage) {
    return res.status(400).json({ error: 'Medication and dosage are required' });
  }

  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const prescription = new Prescription({
      patientId: patient._id,
      patientName: patient.name,
      visitId: visitId || null,
      medication,
      dosage,
      frequency: frequency || '',
      duration: duration || '',
      notes: notes || '',
      prescribedBy: req.user.name,
      prescribedByOrg: req.user.organization
    });

    await prescription.save();
    res.status(201).json(prescription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Attachment list omits the base64 `data` payload so the list stays light;
// fetch a single attachment's full content via GET /:id/attachments/:attachmentId
router.get('/:id/attachments', auth, async (req, res) => {
  try {
    const attachments = await Attachment.find({ patientId: req.params.id })
      .select('-data')
      .sort({ uploadedAt: -1 });
    res.json(attachments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

router.get('/:id/attachments/:attachmentId', auth, async (req, res) => {
  try {
    const attachment = await Attachment.findOne({ _id: req.params.attachmentId, patientId: req.params.id });
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    res.json(attachment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attachment' });
  }
});

router.post('/:id/attachments', auth, requireRole('admin', 'clinic', 'hospital', 'lab'), async (req, res) => {
  const { fileName, mimeType, data } = req.body;
  if (!fileName || !mimeType || !data) {
    return res.status(400).json({ error: 'fileName, mimeType, and data are required' });
  }

  const sizeBytes = Math.ceil((data.length * 3) / 4); // approx decoded size from base64 length
  if (sizeBytes > ATTACHMENT_MAX_BYTES) {
    return res.status(413).json({ error: 'File exceeds the 5MB attachment limit' });
  }

  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const attachment = new Attachment({
      patientId: patient._id,
      patientName: patient.name,
      fileName,
      mimeType,
      sizeBytes,
      data,
      uploadedBy: req.user.name
    });

    await attachment.save();
    const { data: _omit, ...withoutData } = attachment.toJSON();
    res.status(201).json(withoutData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

router.delete('/:id/attachments/:attachmentId', auth, requireRole('admin', 'clinic', 'hospital'), async (req, res) => {
  try {
    const attachment = await Attachment.findOneAndDelete({ _id: req.params.attachmentId, patientId: req.params.id });
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

module.exports = router;
