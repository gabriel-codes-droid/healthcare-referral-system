import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Hospital, Patient, Referral } from '../Types';

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [acceptModal, setAcceptModal] = useState<Referral | null>(null);
  const [completeModal, setCompleteModal] = useState<Referral | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [r, p, h] = await Promise.all([api.getReferrals(), api.getPatients(), api.getHospitals()]);
    setReferrals(r);
    setPatients(p);
    setHospitals(h);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const canCreate = ['admin', 'clinic', 'hospital'].includes(user?.role || '');
  const canReview = ['admin', 'hospital'].includes(user?.role || '');

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      const patientId = form.get('patientId') as string;
      await api.recordVisit(patientId, {
        chiefComplaint: form.get('chiefComplaint'),
        diagnosis: form.get('diagnosis'),
        referralNeeded: true
      });
      await api.createReferral({
        patientId,
        toOrganization: form.get('toOrganization'),
        reason: form.get('reason'),
        priority: form.get('priority'),
        notes: form.get('notes')
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!acceptModal) return;
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.acceptReferral(acceptModal.id, {
        appointmentDate: form.get('appointmentDate'),
        appointmentTime: form.get('appointmentTime'),
        assignedDoctor: form.get('assignedDoctor')
      });
      setAcceptModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async (referral: Referral) => {
    const reason = window.prompt('Rejection reason:', 'Not accepted at this time');
    if (reason === null) return;
    try {
      await api.rejectReferral(referral.id, reason);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!completeModal) return;
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.completeReferral(completeModal.id, form.get('treatmentNotes') as string);
      setCompleteModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const hospitalOptions = hospitals.filter((h) => h.type === 'hospital');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Referrals</h1>
          <p>
            {user?.role === 'hospital'
              ? 'Review incoming referrals from clinics'
              : 'Create and track patient referrals'}
          </p>
        </div>
        {canCreate && (
          <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> New Referral
          </button>
        )}
      </div>

      <section className="panel referral-table">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((referral) => (
                <tr key={referral.id}>
                  <td>
                    <div className="patient-cell">
                      <img
                        src={referral.patientAvatar || `https://i.pravatar.cc/80?u=${referral.patientName}`}
                        alt={referral.patientName}
                      />
                      <span>{referral.patientName}</span>
                    </div>
                  </td>
                  <td>{referral.fromOrganization}</td>
                  <td>{referral.toOrganization}</td>
                  <td>{referral.reason}</td>
                  <td>
                    <span className={`priority ${referral.priority}`}>{referral.priority}</span>
                  </td>
                  <td>
                    <span className={`status ${referral.status}`}>{referral.status}</span>
                  </td>
                  <td>{new Date(referral.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-group">
                      {canReview && referral.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            className="btn-success btn-sm"
                            onClick={() => setAcceptModal(referral)}
                          >
                            <Check size={14} /> Accept
                          </button>
                          <button
                            type="button"
                            className="btn-danger btn-sm"
                            onClick={() => handleReject(referral)}
                          >
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}
                      {referral.status === 'accepted' && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => setCompleteModal(referral)}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title="Create Referral" open={modalOpen} onClose={() => setModalOpen(false)} wide>
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            Patient *
            <select name="patientId" required>
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Refer To *
            <select name="toOrganization" required>
              <option value="">Select hospital</option>
              {hospitalOptions.map((h) => (
                <option key={h.id} value={h.name}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reason *
            <input name="reason" required />
          </label>
          <label>
            Priority
            <select name="priority">
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </label>
          <label>
            Chief Complaint
            <input name="chiefComplaint" />
          </label>
          <label>
            Diagnosis
            <input name="diagnosis" />
          </label>
          <label className="full-width">
            Notes
            <textarea name="notes" rows={3} />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Submit Referral
          </button>
        </form>
      </Modal>

      <Modal
        title={`Accept Referral — ${acceptModal?.patientName}`}
        open={Boolean(acceptModal)}
        onClose={() => setAcceptModal(null)}
      >
        <form className="form-grid" onSubmit={handleAccept}>
          <label>
            Appointment Date *
            <input
              name="appointmentDate"
              type="date"
              required
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </label>
          <label>
            Time *
            <input name="appointmentTime" defaultValue="10:00 AM" required />
          </label>
          <label className="full-width">
            Assigned Doctor
            <input name="assignedDoctor" defaultValue={user?.name} />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Accept & Schedule Appointment
          </button>
        </form>
      </Modal>

      <Modal
        title={`Complete Treatment — ${completeModal?.patientName}`}
        open={Boolean(completeModal)}
        onClose={() => setCompleteModal(null)}
      >
        <form className="form-grid" onSubmit={handleComplete}>
          <label className="full-width">
            Treatment Notes *
            <textarea
              name="treatmentNotes"
              rows={4}
              placeholder="Describe treatment provided and outcome..."
              required
            />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Mark Completed
          </button>
        </form>
      </Modal>
    </>
  );
}
