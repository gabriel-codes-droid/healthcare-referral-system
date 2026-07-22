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

  getMe: () => request<import('../Types').User>('/auth/me'),

  getPatients: () => request<import('../Types').Patient[]>('/patients'),

  createPatient: (data: Partial<import('../Types').Patient>) =>
    request<import('../Types').Patient>('/patients', { method: 'POST', body: JSON.stringify(data) }),

  recordVisit: (patientId: string, data: Record<string, unknown>) =>
    request<import('../Types').Visit>(`/patients/${patientId}/visit`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

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

  getDoctors: () => request<import('../Types').Doctor[]>('/hospitals/doctors'),

  getStats: () => request<import('../Types').DashboardStats>('/hospitals/stats')
};
