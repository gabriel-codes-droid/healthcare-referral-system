export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'clinic' | 'hospital' | 'lab' | 'admin';
  organization: string;
  avatar: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  avatar: string;
  allergies: string[];
  registeredAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  visitId: string | null;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  prescribedBy: string;
  prescribedByOrg: string;
  prescribedAt: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  serviceType: string;
  description: string;
  amount: number;
  currency: string;
  payerType: 'self-pay' | 'insurance';
  insuranceProvider: string;
  insurancePolicyNumber: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  issuedBy: string;
  issuedByOrg: string;
  issuedAt: string;
  paidAt: string | null;
}
export interface AuditLogEntry {
  id: string;
  userName: string;
  userOrg: string;
  userRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}
export interface Message {
  id: string;
  referralId: string;
  senderName: string;
  senderOrg: string;
  text: string;
  createdAt: string;
}
export interface Attachment {
  id: string;
  patientId: string;
  patientName: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  chiefComplaint: string;
  diagnosis: string;
  notes: string;
  referralNeeded: boolean;
  visitedAt: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  fromOrganization: string;
  toOrganization: string;
  reason: string;
  priority: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  visitId: string | null;
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  completedAt: string | null;
  rejectionReason?: string;
  treatmentNotes?: string;
  appointmentId?: string;
}

export interface Appointment {
  id: string;
  referralId: string | null;
  patientId: string;
  patientName: string;
  doctorId: string | null;
  doctorName: string;
  hospitalName: string;
  type: string;
  date: string;
  time: string;
  status: string;
  createdAt: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  referralId: string | null;
  testType: string;
  labName: string;
  requestedBy: string;
  requestedByOrg: string;
  status: string;
  notes: string;
  requestedAt: string;
  results?: LabResult[];
}

export interface LabResult {
  id: string;
  labTestId: string;
  patientId: string;
  patientName: string;
  testType: string;
  findings: string;
  summary: string;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Hospital {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'laboratory';
  location: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  avatar: string;
  hospitalId: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalReferrals: number;
  totalAppointments: number;
  labsCompleted: number;
  referralStatus: Record<string, number>;
  recentReferrals: Referral[];
  upcomingAppointments: Appointment[];
  topDoctors: Doctor[];
}
