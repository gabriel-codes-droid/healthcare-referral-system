const mongoose = require('mongoose');
const toJSONPlugin = require('./plugins/toJSON');

const invoiceSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  serviceType: { type: String, enum: ['referral', 'appointment', 'labTest', 'other'], default: 'other' },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'RWF' },
  payerType: { type: String, enum: ['self-pay', 'insurance'], default: 'self-pay' },
  insuranceProvider: { type: String, default: '' },
  insurancePolicyNumber: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'paid', 'overdue', 'cancelled'], default: 'pending' },
  issuedBy: { type: String, required: true },
  issuedByOrg: { type: String, required: true },
  issuedAt: { type: Date, default: Date.now },
  paidAt: { type: Date }
});

invoiceSchema.plugin(toJSONPlugin);

module.exports = mongoose.model('Invoice', invoiceSchema);
