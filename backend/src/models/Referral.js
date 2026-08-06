const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  patientName: { type: String, required: true },
  patientAvatar: { type: String },
  fromOrganization: { type: String, required: true },
  toOrganization: { type: String, required: true },
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  assignedDoctorName: { type: String },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected', 'completed'], default: 'pending' },
  rejectionReason: { type: String },
  treatmentNotes: { type: String },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Referral', referralSchema);
