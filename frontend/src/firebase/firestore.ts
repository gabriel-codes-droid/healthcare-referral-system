import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore';
import { getAppUser } from './auth';
import { getAuthInstance, getDB } from './config';
import type {
  Appointment,
  Attachment,
  AuditLogEntry,
  DashboardStats,
  Doctor,
  Hospital,
  LabResult,
  LabTest,
  Message,
  Patient,
  Prescription,
  Referral,
  User,
  Visit
} from '../Types';

const COLLECTIONS = {
  patients: 'patients',
  visits: 'visits',
  prescriptions: 'prescriptions',
  attachments: 'attachments',
  referrals: 'referrals',
  appointments: 'appointments',
  labTests: 'labTests',
  labResults: 'labResults',
  hospitals: 'hospitals',
  doctors: 'doctors',
  messages: 'messages',
  auditLogs: 'auditLogs'
} as const;

type TimestampLike = { toDate?: () => Date };

type FirestoreRecord = DocumentData & { id: string };

function toIso(value: unknown): unknown {
  if (!value) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as TimestampLike).toDate === 'function') {
    return (value as TimestampLike).toDate!().toISOString();
  }
  return value;
}

function normalizeRecord(id: string, data: DocumentData): FirestoreRecord {
  return Object.fromEntries(Object.entries({ id, ...data }).map(([key, value]) => [key, toIso(value)])) as FirestoreRecord;
}

function sortByDate<T extends object>(items: T[], field: string, direction: 'asc' | 'desc' = 'desc'): T[] {
  return items.sort((a, b) => {
    const aTime = Date.parse(String((a as Record<string, unknown>)[field] || '')) || 0;
    const bTime = Date.parse(String((b as Record<string, unknown>)[field] || '')) || 0;
    return direction === 'desc' ? bTime - aTime : aTime - bTime;
  });
}

async function requireUser(): Promise<User> {
  const firebaseUser = getAuthInstance().currentUser;
  if (!firebaseUser) throw new Error('Authentication required.');
  return getAppUser(firebaseUser);
}

function assertRole(user: User, roles: User['role'][]): void {
  if (!roles.includes(user.role)) throw new Error('You do not have permission to perform this action.');
}

async function readCollection(name: string, constraints: QueryConstraint[] = []): Promise<FirestoreRecord[]> {
  const snapshot = await getDocs(query(collection(getDB(), name), ...constraints));
  return snapshot.docs.map((item) => normalizeRecord(item.id, item.data()));
}

async function readRecord(name: string, id: string): Promise<FirestoreRecord | null> {
  const snapshot = await getDoc(doc(getDB(), name, id));
  return snapshot.exists() ? normalizeRecord(snapshot.id, snapshot.data()) : null;
}

async function createRecord(name: string, data: DocumentData): Promise<FirestoreRecord> {
  const now = new Date().toISOString();
  const reference = await addDoc(collection(getDB(), name), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return { id: reference.id, ...data, createdAt: now, updatedAt: now };
}

async function updateRecord(name: string, id: string, data: DocumentData): Promise<FirestoreRecord> {
  await updateDoc(doc(getDB(), name, id), { ...data, updatedAt: serverTimestamp() });
  return { id, ...data, updatedAt: new Date().toISOString() };
}

async function deleteByPatient(patientId: string, collectionName: string): Promise<FirestoreRecord[]> {
  const records = await readCollection(collectionName, [where('patientId', '==', patientId)]);
  if (records.length) {
    const batch = writeBatch(getDB());
    records.forEach((record) => batch.delete(doc(getDB(), collectionName, record.id)));
    await batch.commit();
  }
  return records;
}

// Patients, visits, prescriptions, and attachments
export async function getPatients(): Promise<Patient[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const records = await readCollection(COLLECTIONS.patients);
  return sortByDate(records, 'registeredAt').map((record) => ({
    ...record,
    allergies: Array.isArray(record.allergies) ? record.allergies : [],
    registeredAt: String(record.registeredAt || record.createdAt || '')
  })) as Patient[];
}

export async function getPatient(id: string): Promise<Patient | null> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const record = await readRecord(COLLECTIONS.patients, id);
  if (!record) return null;
  return { ...record, allergies: Array.isArray(record.allergies) ? record.allergies : [] } as Patient;
}

export async function createPatient(data: Partial<Patient>): Promise<Patient> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  if (!data.name?.trim() || !data.email?.trim() || !data.phone?.trim()) {
    throw new Error('Name, email, and phone are required.');
  }
  const record = await createRecord(COLLECTIONS.patients, {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    phone: data.phone.trim(),
    dateOfBirth: data.dateOfBirth || '',
    gender: data.gender || '',
    address: data.address || '',
    avatar: data.avatar || `https://i.pravatar.cc/80?u=${encodeURIComponent(data.email)}`,
    allergies: data.allergies || [],
    registeredAt: new Date().toISOString(),
    createdBy: user.id,
    createdByOrg: user.organization
  });
  await createAuditLog({ action: 'patient.create', targetType: 'Patient', targetId: record.id });
  return record as Patient;
}

export async function updatePatient(id: string, data: Partial<Patient>): Promise<Patient> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  return updateRecord(COLLECTIONS.patients, id, data) as Promise<Patient>;
}

export async function updateAllergies(id: string, allergies: string[]): Promise<Patient> {
  return updatePatient(id, { allergies: [...new Set(allergies.map((item) => item.trim()).filter(Boolean))] });
}

export async function deletePatient(id: string): Promise<{ success: true }> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  await deleteByPatient(id, COLLECTIONS.attachments);
  await Promise.all([
    deleteByPatient(id, COLLECTIONS.visits),
    deleteByPatient(id, COLLECTIONS.prescriptions),
    deleteByPatient(id, COLLECTIONS.referrals),
    deleteByPatient(id, COLLECTIONS.appointments),
    deleteByPatient(id, COLLECTIONS.labTests),
    deleteByPatient(id, COLLECTIONS.labResults)
  ]);
  await deleteDoc(doc(getDB(), COLLECTIONS.patients, id));
  await createAuditLog({ action: 'patient.delete', targetType: 'Patient', targetId: id });
  return { success: true };
}

export async function getVisits(patientId: string): Promise<Visit[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const records = await readCollection(COLLECTIONS.visits, [where('patientId', '==', patientId)]);
  return sortByDate(records, 'visitedAt') as Visit[];
}

export async function createVisit(patientId: string, data: Record<string, unknown>): Promise<Visit> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const patient = await getPatient(patientId);
  if (!patient) throw new Error('Patient not found.');
  const record = await createRecord(COLLECTIONS.visits, {
    ...data,
    patientId,
    patientName: patient.name,
    doctorId: data.doctorId || user.id,
    doctorName: data.doctorName || user.name,
    clinicName: data.clinicName || user.organization,
    visitedAt: new Date().toISOString()
  });
  return record as Visit;
}

export async function getPrescriptions(patientId: string): Promise<Prescription[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const records = await readCollection(COLLECTIONS.prescriptions, [where('patientId', '==', patientId)]);
  return sortByDate(records, 'prescribedAt') as Prescription[];
}

export async function createPrescription(patientId: string, data: Record<string, unknown>): Promise<Prescription> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const patient = await getPatient(patientId);
  if (!patient) throw new Error('Patient not found.');
  const record = await createRecord(COLLECTIONS.prescriptions, {
    ...data,
    patientId,
    patientName: patient.name,
    visitId: data.visitId || null,
    prescribedBy: user.name,
    prescribedByOrg: user.organization,
    prescribedAt: new Date().toISOString()
  });
  return record as Prescription;
}

export async function getAttachments(patientId: string): Promise<Attachment[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const records = await readCollection(COLLECTIONS.attachments, [where('patientId', '==', patientId)]);
  return sortByDate(records, 'uploadedAt') as Attachment[];
}

export async function getAttachment(patientId: string, attachmentId: string): Promise<Attachment> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const record = await readRecord(COLLECTIONS.attachments, attachmentId);
  if (!record || record.patientId !== patientId) throw new Error('Attachment not found.');
  if (!record.data) throw new Error('Attachment data is missing.');
  return record as Attachment;
}

export async function uploadAttachment(patientId: string, data: Record<string, unknown>): Promise<Attachment> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const patient = await getPatient(patientId);
  if (!patient) throw new Error('Patient not found.');
  const fileName = String(data.fileName || 'attachment').trim();
  const mimeType = String(data.mimeType || 'application/octet-stream');
  const base64 = String(data.data || '');
  if (!base64) throw new Error('Attachment data is required.');
  if (base64.length > 900 * 1024) throw new Error('Attachment is too large for Firestore. The Firestore-only limit is 650 KB.');
  const record = await createRecord(COLLECTIONS.attachments, {
    patientId,
    patientName: patient.name,
    fileName,
    mimeType,
    sizeBytes: Math.floor(base64.length * 0.75),
    data: base64,
    uploadedBy: user.name,
    uploadedById: user.id,
    uploadedAt: new Date().toISOString()
  });
  return record as Attachment;
}

export async function deleteAttachment(patientId: string, attachmentId: string): Promise<{ success: true }> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const record = await readRecord(COLLECTIONS.attachments, attachmentId);
  if (!record || record.patientId !== patientId) throw new Error('Attachment not found.');
  await deleteDoc(doc(getDB(), COLLECTIONS.attachments, attachmentId));
  return { success: true };
}

export async function exportPatientData(patientId: string): Promise<Record<string, unknown>> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const patient = await getPatient(patientId);
  if (!patient) throw new Error('Patient not found.');
  const [visits, prescriptions, attachments, referrals, appointments, labTests] = await Promise.all([
    getVisits(patientId), getPrescriptions(patientId), getAttachments(patientId),
    getReferrals(), getAppointments(), getLabTests()
  ]);
  const patientReferrals = referrals.filter((item) => item.patientId === patientId);
  const patientAppointments = appointments.filter((item) => item.patientId === patientId);
  const patientLabTests = labTests.filter((item) => item.patientId === patientId);
  const attachmentData = await Promise.all(attachments.map((item) => getAttachment(patientId, item.id)));
  return { exportedAt: new Date().toISOString(), patient, visits, prescriptions, attachments: attachmentData, referrals: patientReferrals, appointments: patientAppointments, labTests: patientLabTests };
}

// Referrals and messaging
export async function getReferrals(): Promise<Referral[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const constraints: QueryConstraint[] = [];
  if (user.role === 'clinic') constraints.push(where('fromOrganization', '==', user.organization));
  if (user.role === 'hospital') constraints.push(where('toOrganization', '==', user.organization));
  const records = await readCollection(COLLECTIONS.referrals, constraints);
  return sortByDate(records, 'createdAt') as Referral[];
}

export async function createReferral(data: Record<string, unknown>): Promise<Referral> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const patientId = String(data.patientId || '');
  const patient = await getPatient(patientId);
  if (!patient) throw new Error('Patient not found.');
  const toOrganization = String(data.toOrganization || '').trim();
  const reason = String(data.reason || '').trim();
  if (!toOrganization || !reason) throw new Error('Destination organization and reason are required.');
  const record = await createRecord(COLLECTIONS.referrals, {
    patientId,
    patientName: patient.name,
    patientAvatar: patient.avatar || '',
    visitId: data.visitId || null,
    fromOrganization: user.organization,
    toOrganization,
    reason,
    priority: data.priority || 'normal',
    notes: data.notes || '',
    status: 'pending',
    createdBy: user.id,
    createdByName: user.name,
    reviewedAt: null,
    reviewedBy: null,
    completedAt: null
  });
  return record as Referral;
}

export async function acceptReferral(id: string, data: Record<string, unknown>): Promise<{ referral: Referral; appointment: Appointment }> {
  const user = await requireUser();
  assertRole(user, ['admin', 'hospital']);
  const referral = await readRecord(COLLECTIONS.referrals, id) as Referral | null;
  if (!referral) throw new Error('Referral not found.');
  if (referral.status !== 'pending') throw new Error(`Referral is already ${referral.status}.`);
  if (user.role === 'hospital' && referral.toOrganization !== user.organization) throw new Error('This referral is not for your organization.');
  const appointment = await createAppointment({
    patientId: referral.patientId,
    referralId: id,
    doctorId: data.doctorId || null,
    doctorName: data.assignedDoctor || user.name,
    hospitalName: referral.toOrganization,
    type: referral.reason,
    date: data.appointmentDate || new Date().toISOString().slice(0, 10),
    time: data.appointmentTime || '10:00',
    status: 'scheduled'
  });
  const updated = await updateRecord(COLLECTIONS.referrals, id, {
    status: 'accepted',
    appointmentId: appointment.id,
    reviewedAt: new Date().toISOString(),
    reviewedBy: user.id
  });
  return { referral: updated as Referral, appointment };
}

export async function rejectReferral(id: string, rejectionReason: string): Promise<Referral> {
  const user = await requireUser();
  assertRole(user, ['admin', 'hospital']);
  const referral = await readRecord(COLLECTIONS.referrals, id) as Referral | null;
  if (!referral) throw new Error('Referral not found.');
  if (referral.status !== 'pending') throw new Error(`Referral is already ${referral.status}.`);
  if (user.role === 'hospital' && referral.toOrganization !== user.organization) throw new Error('This referral is not for your organization.');
  return updateRecord(COLLECTIONS.referrals, id, {
    status: 'rejected',
    rejectionReason: rejectionReason.trim() || 'Not accepted at this time',
    reviewedAt: new Date().toISOString(),
    reviewedBy: user.id
  }) as Promise<Referral>;
}

export async function completeReferral(id: string, treatmentNotes: string): Promise<Referral> {
  const user = await requireUser();
  assertRole(user, ['admin', 'hospital']);
  return updateRecord(COLLECTIONS.referrals, id, {
    status: 'completed',
    treatmentNotes,
    completedAt: new Date().toISOString(),
    reviewedBy: user.id
  }) as Promise<Referral>;
}

export async function getMessages(referralId: string): Promise<Message[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const referral = await readRecord(COLLECTIONS.referrals, referralId);
  if (!referral || (user.role !== 'admin' && referral.fromOrganization !== user.organization && referral.toOrganization !== user.organization)) {
    throw new Error('You do not have access to this referral conversation.');
  }
  const records = await readCollection(COLLECTIONS.messages, [where('referralId', '==', referralId)]);
  return sortByDate(records, 'createdAt', 'asc') as Message[];
}

export async function sendMessage(referralId: string, text: string): Promise<Message> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  await getMessages(referralId);
  if (!text.trim()) throw new Error('Message cannot be empty.');
  const record = await createRecord(COLLECTIONS.messages, {
    referralId,
    text: text.trim(),
    senderId: user.id,
    senderName: user.name,
    senderOrg: user.organization
  });
  return record as Message;
}

// Appointments
function daySlots(): { time: string; available: boolean }[] {
  return Array.from({ length: 16 }, (_, index) => {
    const minutes = 9 * 60 + index * 30;
    return { time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`, available: true };
  });
}

export async function getAppointments(): Promise<Appointment[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const constraints: QueryConstraint[] = user.role === 'hospital' ? [where('hospitalName', '==', user.organization)] : [];
  const records = await readCollection(COLLECTIONS.appointments, constraints);
  return sortByDate(records, 'createdAt') as Appointment[];
}

export async function getAvailability(doctorId: string, date: string): Promise<{ date: string; doctorId: string; slots: { time: string; available: boolean }[] }> {
  await requireUser();
  const appointments = await readCollection(COLLECTIONS.appointments, [where('doctorId', '==', doctorId), where('date', '==', date)]);
  const bookedTimes = new Set(appointments.filter((item) => item.status !== 'cancelled').map((item) => String(item.time)));
  return { date, doctorId, slots: daySlots().map((slot) => ({ ...slot, available: !bookedTimes.has(slot.time) })) };
}

export async function createAppointment(data: Record<string, unknown>): Promise<Appointment> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const patient = await getPatient(String(data.patientId || ''));
  if (!patient) throw new Error('Patient not found.');
  const doctorId = data.doctorId ? String(data.doctorId) : null;
  let doctorName = String(data.doctorName || user.name);
  if (doctorId) {
    const doctor = await readRecord(COLLECTIONS.doctors, doctorId);
    if (!doctor) throw new Error('Doctor not found.');
    doctorName = String(doctor.name);
    const conflicts = await readCollection(COLLECTIONS.appointments, [where('doctorId', '==', doctorId), where('date', '==', data.date), where('time', '==', data.time)]);
    if (conflicts.some((item) => item.status !== 'cancelled')) throw new Error('This doctor is already booked for that time slot.');
  }
  const record = await createRecord(COLLECTIONS.appointments, {
    referralId: data.referralId || null,
    patientId: patient.id,
    patientName: patient.name,
    doctorId,
    doctorName,
    hospitalName: data.hospitalName || user.organization,
    type: data.type || 'consultation',
    date: String(data.date || ''),
    time: String(data.time || ''),
    status: data.status || 'scheduled'
  });
  return record as Appointment;
}

// Laboratories
export async function getLabTests(): Promise<LabTest[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  const constraints: QueryConstraint[] = [];
  if (user.role === 'lab') constraints.push(where('labName', '==', user.organization));
  if (user.role === 'clinic' || user.role === 'hospital') constraints.push(where('requestedByOrg', '==', user.organization));
  const tests = await readCollection(COLLECTIONS.labTests, constraints);
  const results = await readCollection(COLLECTIONS.labResults);
  return sortByDate(tests, 'requestedAt').map((test) => ({
    ...test,
    results: results.filter((result) => result.labTestId === test.id)
  })) as LabTest[];
}

export async function createLabTest(data: Record<string, unknown>): Promise<LabTest> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  const patient = await getPatient(String(data.patientId || ''));
  if (!patient) throw new Error('Patient not found.');
  const record = await createRecord(COLLECTIONS.labTests, {
    patientId: patient.id,
    patientName: patient.name,
    referralId: data.referralId || null,
    testType: String(data.testType || '').trim(),
    labName: String(data.labName || '').trim(),
    requestedBy: user.name,
    requestedByOrg: user.organization,
    status: 'pending',
    notes: data.notes || '',
    requestedAt: new Date().toISOString()
  });
  return { ...record, results: [] } as unknown as LabTest;
}

export async function createLabResult(data: Record<string, unknown>): Promise<LabResult> {
  const user = await requireUser();
  assertRole(user, ['admin', 'lab']);
  const labTestId = String(data.labTestId || '');
  const test = await readRecord(COLLECTIONS.labTests, labTestId);
  if (!test) throw new Error('Lab test not found.');
  if (user.role === 'lab' && test.labName && test.labName !== user.organization) throw new Error('This lab test is assigned to another laboratory.');
  const record = await createRecord(COLLECTIONS.labResults, {
    labTestId,
    patientId: test.patientId,
    patientName: test.patientName,
    testType: test.testType,
    findings: String(data.findings || '').trim(),
    summary: String(data.summary || '').trim(),
    fileName: String(data.fileName || ''),
    uploadedBy: user.name,
    uploadedAt: new Date().toISOString()
  });
  await updateRecord(COLLECTIONS.labTests, labTestId, { status: 'completed', completedDate: new Date().toISOString() });
  return record as LabResult;
}

// Hospitals and doctors
export async function getHospitals(): Promise<Hospital[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital', 'lab']);
  return sortByDate(await readCollection(COLLECTIONS.hospitals), 'createdAt') as Hospital[];
}

export async function createHospital(data: Record<string, unknown>): Promise<Hospital> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  return createRecord(COLLECTIONS.hospitals, {
    name: String(data.name || '').trim(),
    type: data.type || 'hospital',
    location: String(data.location || '').trim()
  }) as Promise<Hospital>;
}

export async function updateHospital(id: string, data: Record<string, unknown>): Promise<Hospital> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  return updateRecord(COLLECTIONS.hospitals, id, data) as Promise<Hospital>;
}

export async function deleteHospital(id: string): Promise<{ success: true }> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  const doctors = await readCollection(COLLECTIONS.doctors, [where('hospitalId', '==', id)]);
  const batch = writeBatch(getDB());
  doctors.forEach((doctor) => batch.delete(doc(getDB(), COLLECTIONS.doctors, doctor.id)));
  batch.delete(doc(getDB(), COLLECTIONS.hospitals, id));
  await batch.commit();
  return { success: true };
}

export async function getDoctors(): Promise<Doctor[]> {
  const user = await requireUser();
  assertRole(user, ['admin', 'clinic', 'hospital']);
  return sortByDate(await readCollection(COLLECTIONS.doctors), 'createdAt') as Doctor[];
}

export async function createDoctor(data: Record<string, unknown>): Promise<Doctor> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  const name = String(data.name || '').trim();
  const specialty = String(data.specialty || '').trim();
  if (!name || !specialty) throw new Error('Name and specialty are required.');
  if (data.hospitalId) {
    const hospital = await readRecord(COLLECTIONS.hospitals, String(data.hospitalId));
    if (!hospital) throw new Error('Hospital not found.');
  }
  return createRecord(COLLECTIONS.doctors, {
    name,
    specialty,
    hospitalId: data.hospitalId || null,
    avatar: data.avatar || `https://i.pravatar.cc/80?u=${encodeURIComponent(name)}`,
    rating: Number(data.rating || 0)
  }) as Promise<Doctor>;
}

export async function updateDoctor(id: string, data: Record<string, unknown>): Promise<Doctor> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  return updateRecord(COLLECTIONS.doctors, id, data) as Promise<Doctor>;
}

export async function deleteDoctor(id: string): Promise<{ success: true }> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  await deleteDoc(doc(getDB(), COLLECTIONS.doctors, id));
  return { success: true };
}

// Dashboard and audit logs
export async function getStats(): Promise<DashboardStats> {
  const user = await requireUser();
  const canSeeReferrals = ['admin', 'clinic', 'hospital'].includes(user.role);
  const canSeeAppointments = ['admin', 'clinic', 'hospital'].includes(user.role);
  const canSeeDoctors = ['admin', 'clinic', 'hospital'].includes(user.role);
  const [patients, referrals, appointments, labTests, doctors] = await Promise.all([
    getPatients(),
    canSeeReferrals ? getReferrals() : Promise.resolve([] as Referral[]),
    canSeeAppointments ? getAppointments() : Promise.resolve([] as Appointment[]),
    getLabTests(),
    canSeeDoctors ? getDoctors() : Promise.resolve([] as Doctor[])
  ]);
  const referralStatus = referrals.reduce<Record<string, number>>((counts, referral) => {
    counts[referral.status] = (counts[referral.status] || 0) + 1;
    return counts;
  }, {});
  return {
    totalPatients: patients.length,
    totalReferrals: referrals.length,
    totalAppointments: appointments.length,
    labsCompleted: labTests.filter((test) => test.status === 'completed').length,
    referralStatus,
    recentReferrals: sortByDate([...referrals], 'createdAt').slice(0, 5),
    upcomingAppointments: appointments.filter((item) => item.status === 'scheduled').slice(0, 5),
    topDoctors: [...doctors].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4)
  };
}

export async function getAuditLogs(): Promise<AuditLogEntry[]> {
  const user = await requireUser();
  assertRole(user, ['admin']);
  return sortByDate(await readCollection(COLLECTIONS.auditLogs), 'createdAt') as AuditLogEntry[];
}

export async function createAuditLog(data: Record<string, unknown>): Promise<AuditLogEntry> {
  const user = await requireUser();
  const record = await createRecord(COLLECTIONS.auditLogs, {
    userId: user.id,
    userName: user.name,
    userOrg: user.organization,
    userRole: user.role,
    action: data.action || 'unknown',
    targetType: data.targetType || '',
    targetId: data.targetId || '',
    details: data.details || '',
    timestamp: serverTimestamp()
  });
  return record as AuditLogEntry;
}
