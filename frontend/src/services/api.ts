const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('sympra_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: import('../Types').User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  signup: (name: string, email: string, password: string, role?: string, organization?: string) =>
    request<{ token: string; user: import('../Types').User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, organization })
    }),

  getMe: () => request<import('../Types').User>('/auth/me'),

  getPatients: () => request<import('../Types').Patient[]>('/patients'),

  createPatient: (data: Partial<import('../Types').Patient>) =>
    request<import('../Types').Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }),

  recordVisit: (patientId: string, data: Record<string, unknown>) =>
    request<import('../Types').Visit>(`/patients/${patientId}/visit`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getVisits: (patientId: string) => request<import('../Types').Visit[]>(`/patients/${patientId}/visits`),

  updateAllergies: (patientId: string, allergies: string[]) =>
    request<import('../Types').Patient>(`/patients/${patientId}/allergies`, {
      method: 'PATCH',
      body: JSON.stringify({ allergies })
    }),

  getPrescriptions: (patientId: string) =>
    request<import('../Types').Prescription[]>(`/patients/${patientId}/prescriptions`),

  createPrescription: (patientId: string, data: Record<string, unknown>) =>
    request<import('../Types').Prescription>(`/patients/${patientId}/prescriptions`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getAttachments: (patientId: string) =>
    request<import('../Types').Attachment[]>(`/patients/${patientId}/attachments`),

  getAttachment: (patientId: string, attachmentId: string) =>
    request<import('../Types').Attachment>(`/patients/${patientId}/attachments/${attachmentId}`),

  uploadAttachment: (patientId: string, data: Record<string, unknown>) =>
    request<import('../Types').Attachment>(`/patients/${patientId}/attachments`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  deleteAttachment: (patientId: string, attachmentId: string) =>
    request<{ success: boolean }>(`/patients/${patientId}/attachments/${attachmentId}`, { method: 'DELETE' }),

  getReferrals: () => request<import('../Types').Referral[]>('/referrals'),

  createReferral: (data: Record<string, unknown>) =>
    request<import('../Types').Referral>('/referrals', { method: 'POST', body: JSON.stringify(data) }),

  acceptReferral: (id: string, data: Record<string, unknown>) =>
    request<{ referral: import('../Types').Referral; appointment: import('../Types').Appointment }>(
      `/referrals/${id}/accept`,
      { method: 'PATCH', body: JSON.stringify(data) }
    ),

  rejectReferral: (id: string, rejectionReason: string) =>
    request<import('../Types').Referral>(`/referrals/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectionReason })
    }),

  completeReferral: (id: string, treatmentNotes: string) =>
    request<import('../Types').Referral>(`/referrals/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ treatmentNotes })
    }),

  getMessages: (referralId: string) => request<import('../Types').Message[]>(`/messages/${referralId}`),

  sendMessage: (referralId: string, text: string) =>
    request<import('../Types').Message>(`/messages/${referralId}`, {
      method: 'POST',
      body: JSON.stringify({ text })
    }),

  getAppointments: () => request<import('../Types').Appointment[]>('/appointments'),

  getAvailability: (doctorId: string, date: string) =>
    request<{ date: string; doctorId: string; slots: { time: string; available: boolean }[] }>(
      `/appointments/availability?doctorId=${doctorId}&date=${date}`
    ),

  createAppointment: (data: Record<string, unknown>) =>
    request<import('../Types').Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getLabTests: () => request<import('../Types').LabTest[]>('/labs/tests'),

  requestLabTest: (data: Record<string, unknown>) =>
    request<import('../Types').LabTest>('/labs/tests', { method: 'POST', body: JSON.stringify(data) }),

  uploadLabResult: (data: Record<string, unknown>) =>
    request<import('../Types').LabResult>('/labs/results', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getHospitals: () => request<import('../Types').Hospital[]>('/hospitals'),

  createHospital: (data: Record<string, unknown>) =>
    request<import('../Types').Hospital>('/hospitals', { method: 'POST', body: JSON.stringify(data) }),

  updateHospital: (id: string, data: Record<string, unknown>) =>
    request<import('../Types').Hospital>(`/hospitals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteHospital: (id: string) => request<{ success: boolean }>(`/hospitals/${id}`, { method: 'DELETE' }),

  getDoctors: () => request<import('../Types').Doctor[]>('/hospitals/doctors'),

  createDoctor: (data: Record<string, unknown>) =>
    request<import('../Types').Doctor>('/hospitals/doctors', { method: 'POST', body: JSON.stringify(data) }),

  updateDoctor: (id: string, data: Record<string, unknown>) =>
    request<import('../Types').Doctor>(`/hospitals/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteDoctor: (id: string) => request<{ success: boolean }>(`/hospitals/doctors/${id}`, { method: 'DELETE' }),

  getStats: () => request<import('../Types').DashboardStats>('/hospitals/stats'),

  getInvoices: () => request<import('../Types').Invoice[]>('/billing'),

  getBillingSummary: () =>
    request<{ collected: number; outstanding: number; count: number }>('/billing/summary'),

  createInvoice: (data: Record<string, unknown>) =>
    request<import('../Types').Invoice>('/billing', { method: 'POST', body: JSON.stringify(data) }),

  updateInvoiceStatus: (id: string, status: string) =>
    request<import('../Types').Invoice>(`/billing/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  sendVerificationCode: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  verifyCode: (email: string, code: string) =>
    request<{ success: boolean; message: string }>('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code })
    }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword })
    }),

  updateProfile: (data: { name?: string; email?: string; avatar?: string }) =>
    request<import('../Types').User>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  deleteAccount: () => request<{ success: boolean }>('/auth/me', { method: 'DELETE' }),

  exportPatientData: (patientId: string) =>
    request<Record<string, unknown>>(`/patients/${patientId}/export`),

  deletePatient: (patientId: string) =>
    request<{ success: boolean }>(`/patients/${patientId}`, { method: 'DELETE' }),

  getAuditLogs: () => request<import('../Types').AuditLogEntry[]>('/audit-logs')
};
