import * as firestore from '../firebase/firestore';
import { deleteCurrentAccount, resetPassword as firebaseResetPassword, updateUserProfile } from '../firebase/auth';
import type { Appointment, AuditLogEntry, Doctor, Hospital, LabResult, LabTest, Message, Patient, Prescription, Referral, User, Visit } from '../Types';

export const api = {
  getPatients: firestore.getPatients,
  getPatient: firestore.getPatient,
  createPatient: (data: Partial<Patient>) => firestore.createPatient(data),
  recordVisit: (patientId: string, data: Record<string, unknown>) => firestore.createVisit(patientId, data),
  getVisits: firestore.getVisits,
  updateAllergies: firestore.updateAllergies,
  getPrescriptions: firestore.getPrescriptions,
  createPrescription: firestore.createPrescription,
  getAttachments: firestore.getAttachments,
  getAttachment: firestore.getAttachment,
  uploadAttachment: firestore.uploadAttachment,
  deleteAttachment: firestore.deleteAttachment,
  deletePatient: firestore.deletePatient,
  exportPatientData: firestore.exportPatientData,

  getReferrals: firestore.getReferrals,
  createReferral: firestore.createReferral,
  acceptReferral: firestore.acceptReferral,
  rejectReferral: firestore.rejectReferral,
  completeReferral: firestore.completeReferral,

  getMessages: firestore.getMessages,
  sendMessage: (referralId: string, text: string) => firestore.sendMessage(referralId, text),

  getAppointments: firestore.getAppointments,
  getAvailability: firestore.getAvailability,
  createAppointment: firestore.createAppointment,

  getLabTests: firestore.getLabTests,
  requestLabTest: firestore.createLabTest,
  uploadLabResult: firestore.createLabResult,

  getHospitals: firestore.getHospitals,
  createHospital: firestore.createHospital,
  updateHospital: firestore.updateHospital,
  deleteHospital: firestore.deleteHospital,

  getDoctors: firestore.getDoctors,
  createDoctor: firestore.createDoctor,
  updateDoctor: firestore.updateDoctor,
  deleteDoctor: firestore.deleteDoctor,

  getStats: firestore.getStats,

  // Firebase Auth sends a secure, time-limited reset link. The former
  // verification-code API is kept as a compatibility alias for old callers.
  sendVerificationCode: async (email: string) => {
    await firebaseResetPassword(email);
    return { success: true, message: 'Password reset email sent' };
  },
  verifyCode: async (_email: string, _code: string) => ({
    success: true,
    message: 'Firebase verifies the reset link in the email.'
  }),
  resetPassword: async (email: string, _code?: string, _newPassword?: string) => {
    await firebaseResetPassword(email);
    return { success: true, message: 'Password reset email sent' };
  },

  updateProfile: (data: { name?: string; email?: string; avatar?: string }) => updateUserProfile(data),
  deleteAccount: async () => {
    await deleteCurrentAccount();
    return { success: true };
  },

  getAuditLogs: firestore.getAuditLogs
};

export type ApiUser = User;
export type ApiPatient = Patient;
export type ApiVisit = Visit;
export type ApiPrescription = Prescription;
export type ApiReferral = Referral;
export type ApiAppointment = Appointment;
export type ApiLabTest = LabTest;
export type ApiLabResult = LabResult;
export type ApiHospital = Hospital;
export type ApiDoctor = Doctor;
export type ApiMessage = Message;
export type ApiAuditLog = AuditLogEntry;
