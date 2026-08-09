const express = require('express');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let invoices = await Invoice.find();

    if (req.user.role !== 'admin') {
      invoices = invoices.filter((inv) => inv.issuedByOrg === req.user.organization);
    }

    res.json(invoices.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt)));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.get('/summary', auth, async (req, res) => {
  try {
    let invoices = await Invoice.find();
    if (req.user.role !== 'admin') {
      invoices = invoices.filter((inv) => inv.issuedByOrg === req.user.organization);
    }

    const summary = invoices.reduce(
      (acc, inv) => {
        if (inv.status === 'paid') acc.collected += inv.amount;
        else if (inv.status === 'pending' || inv.status === 'overdue') acc.outstanding += inv.amount;
        return acc;
      },
      { collected: 0, outstanding: 0, count: invoices.length }
    );

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
});

router.post('/', auth, requireRole('admin', 'clinic', 'hospital', 'lab'), async (req, res) => {
  const { patientId, serviceType, description, amount, payerType, insuranceProvider, insurancePolicyNumber } = req.body;
  if (!patientId || !description || amount === undefined || amount === null) {
    return res.status(400).json({ error: 'Patient, description, and amount are required' });
  }
  if (Number(amount) < 0) {
    return res.status(400).json({ error: 'Amount cannot be negative' });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const invoice = new Invoice({
      patientId,
      patientName: patient.name,
      serviceType: serviceType || 'other',
      description,
      amount: Number(amount),
      payerType: payerType || 'self-pay',
      insuranceProvider: payerType === 'insurance' ? insuranceProvider || '' : '',
      insurancePolicyNumber: payerType === 'insurance' ? insurancePolicyNumber || '' : '',
      issuedBy: req.user.name,
      issuedByOrg: req.user.organization
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.patch('/:id/status', auth, requireRole('admin', 'clinic', 'hospital', 'lab'), async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user.role !== 'admin' && invoice.issuedByOrg !== req.user.organization) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    invoice.status = status;
    invoice.paidAt = status === 'paid' ? new Date() : invoice.paidAt;
    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

module.exports = router;
