import { useEffect, useState } from 'react';
import { Plus, Stethoscope } from 'lucide-react';
import Modal from '../components/Modal';
import { api } from '../services/api';
import type { Patient } from '../Types';

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [visitModal, setVisitModal] = useState<Patient | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.getPatients().then(setPatients).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.createPatient({
        name: form.get('name') as string,
        email: form.get('email') as string,
        phone: form.get('phone') as string,
        dateOfBirth: form.get('dateOfBirth') as string,
        gender: form.get('gender') as string,
        address: form.get('address') as string
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleVisit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!visitModal) return;
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.recordVisit(visitModal.id, {
        chiefComplaint: form.get('chiefComplaint'),
        diagnosis: form.get('diagnosis'),
        notes: form.get('notes'),
        referralNeeded: form.get('referralNeeded') === 'yes'
      });
      setVisitModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Patients</h1>
          <p>Register and manage patient records</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Add Patient
        </button>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <div className="patient-cell">
                      <img src={patient.avatar} alt={patient.name} />
                      <span>{patient.name}</span>
                    </div>
                  </td>
                  <td>{patient.email}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.gender || '—'}</td>
                  <td>{new Date(patient.registeredAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setVisitModal(patient)}
                    >
                      <Stethoscope size={14} /> Examine
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title="Register Patient" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={handleRegister}>
          <label>
            Full Name *
            <input name="name" required />
          </label>
          <label>
            Email *
            <input name="email" type="email" required />
          </label>
          <label>
            Phone *
            <input name="phone" required />
          </label>
          <label>
            Date of Birth
            <input name="dateOfBirth" type="date" />
          </label>
          <label>
            Gender
            <select name="gender">
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="full-width">
            Address
            <input name="address" />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Register
          </button>
        </form>
      </Modal>

      <Modal
        title={`Examine — ${visitModal?.name}`}
        open={Boolean(visitModal)}
        onClose={() => setVisitModal(null)}
      >
        <form className="form-grid" onSubmit={handleVisit}>
          <label className="full-width">
            Chief Complaint
            <input name="chiefComplaint" placeholder="Patient symptoms..." />
          </label>
          <label className="full-width">
            Diagnosis
            <input name="diagnosis" placeholder="Preliminary diagnosis..." />
          </label>
          <label className="full-width">
            Clinical Notes
            <textarea name="notes" rows={3} />
          </label>
          <label className="full-width">
            Referral Needed?
            <select name="referralNeeded">
              <option value="no">No</option>
              <option value="yes">Yes — specialist/hospital required</option>
            </select>
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Save Examination
          </button>
        </form>
      </Modal>
    </>
  );
}
