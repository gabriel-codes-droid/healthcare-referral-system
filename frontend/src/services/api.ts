const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('sympra_token');
}

export type QueuedRequest = { id: string; path: string; options: { method: string; body?: string }; status: 'pending' | 'conflict'; error?: string };
const offlineQueueKey = 'sympra_offline_queue';
function enqueue(path: string, options: RequestInit) {
  const queued: QueuedRequest[] = JSON.parse(localStorage.getItem(offlineQueueKey) || '[]');
  queued.push({ id: crypto.randomUUID(), path, options: { method: options.method || 'POST', body: options.body as string | undefined }, status: 'pending' });
  localStorage.setItem(offlineQueueKey, JSON.stringify(queued));
}
export async function flushOfflineQueue() {
  const queued: QueuedRequest[] = JSON.parse(localStorage.getItem(offlineQueueKey) || '[]');
  const remaining: QueuedRequest[] = [];
  for (const item of queued) {
    if (item.status === 'conflict') { remaining.push(item); continue; }
    try { await request(item.path, item.options); } catch (error) { remaining.push({ ...item, status: error instanceof Error && error.message.toLowerCase().includes('conflict') ? 'conflict' : 'pending', error: error instanceof Error ? error.message : 'Sync failed' }); }
  }
  localStorage.setItem(offlineQueueKey, JSON.stringify(remaining));
}
export const getOfflineQueue = (): QueuedRequest[] => JSON.parse(localStorage.getItem(offlineQueueKey) || '[]');
export const discardOfflineItem = (id: string) => localStorage.setItem(offlineQueueKey, JSON.stringify(getOfflineQueue().filter(item => item.id !== id)));

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try { response = await fetch(`${API_BASE}${path}`, { ...options, headers }); }
  catch (cause) {
    if (options.method && options.method !== 'GET') {
      enqueue(path, options);
      return { id: `offline-${Date.now()}`, queuedOffline: true } as T;
    }
    throw cause;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  messageStreamUrl: () => `${API_BASE}/messages/stream?token=${encodeURIComponent(getToken() || '')}`,
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
  getPatient: (id: string) => request<import('../Types').Patient>(`/patients/${id}`),
  updatePatient: (id: string, data: Record<string, unknown>) => request<import('../Types').Patient>(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  createPatient: (data: Partial<import('../Types').Patient>) =>
    request<import('../Types').Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }),

  recordVisit: (patientId: string, data: Record<string, unknown>) =>
    request<import('../Types').Visit>(`/patients/${patientId}/visit`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getVisits: (patientId: string) => request<import('../Types').Visit[]>(`/patients/${patientId}/visits`),
  addMedicalHistory: (id: string, data: Record<string, unknown>) => request<import('../Types').Patient>(`/patients/${id}/medical-history`, { method: 'POST', body: JSON.stringify(data) }),
  addAllergy: (id: string, data: Record<string, unknown>) => request<import('../Types').Patient>(`/patients/${id}/allergies`, { method: 'POST', body: JSON.stringify(data) }),
  addPrescription: (id: string, data: Record<string, unknown>) => request<import('../Types').Patient>(`/patients/${id}/prescriptions`, { method: 'POST', body: JSON.stringify(data) }),
  addAttachment: (id: string, data: Record<string, unknown>) => request<import('../Types').Patient>(`/patients/${id}/attachments`, { method: 'POST', body: JSON.stringify(data) }),

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

  getAppointments: () => request<import('../Types').Appointment[]>('/appointments'),
  getAvailability: (doctorId: string, date: string) => request<{ slots: string[] }>(`/appointments/availability?doctorId=${doctorId}&date=${date}`),

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
  updateLabTest: (id: string, data: Record<string, unknown>) => request<import('../Types').LabTest>(`/labs/tests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLabTest: (id: string) => request<void>(`/labs/tests/${id}`, { method: 'DELETE' }),

  getHospitals: () => request<import('../Types').Hospital[]>('/hospitals'),
  createHospital: (data: Record<string, unknown>) => request<import('../Types').Hospital>('/hospitals', { method: 'POST', body: JSON.stringify(data) }),
  updateHospital: (id: string, data: Record<string, unknown>) => request<import('../Types').Hospital>(`/hospitals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteHospital: (id: string) => request<void>(`/hospitals/${id}`, { method: 'DELETE' }),

  getDoctors: () => request<import('../Types').Doctor[]>('/hospitals/doctors'),
  createDoctor: (data: Record<string, unknown>) => request<import('../Types').Doctor>('/hospitals/doctors', { method: 'POST', body: JSON.stringify(data) }),
  updateDoctor: (id: string, data: Record<string, unknown>) => request<import('../Types').Doctor>(`/hospitals/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDoctor: (id: string) => request<void>(`/hospitals/doctors/${id}`, { method: 'DELETE' }),

  getStats: () => request<import('../Types').DashboardStats>('/hospitals/stats'),

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
  getMessages: (referralId: string) => request<import('../Types').Message[]>(`/messages/referral/${referralId}`),
  sendMessage: (referralId: string, body: string) => request<import('../Types').Message>(`/messages/referral/${referralId}`, { method: 'POST', body: JSON.stringify({ body }) }),
  exportPatient: (id: string) => request<Record<string, unknown>>(`/privacy/patients/${id}/export`),
  getAuditLogs: () => request<import('../Types').AuditLog[]>('/privacy/audit-logs')
};
