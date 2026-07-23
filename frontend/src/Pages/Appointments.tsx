import { useEffect, useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Appointment, Patient } from '../Types';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [a, p] = await Promise.all([api.getAppointments(), api.getPatients()]);
    setAppointments(a);
    setPatients(p);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.createAppointment({
        patientId: form.get('patientId'),
        doctorName: form.get('doctorName'),
        hospitalName: form.get('hospitalName'),
        type: form.get('type'),
        date: form.get('date'),
        time: form.get('time')
      });
      setModalOpen(false);
      await load();
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
          <Link to="/" className="back-link-header">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Appointments</h1>
          <p>Scheduled visits from accepted referrals and direct bookings</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New Appointment
        </button>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Type</th>
                <th>Doctor</th>
                <th>Hospital</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No appointments scheduled
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id}>
                    <td>{appt.patientName}</td>
                    <td>{appt.type}</td>
                    <td>{appt.doctorName}</td>
                    <td>{appt.hospitalName}</td>
                    <td>{new Date(appt.date).toLocaleDateString()}</td>
                    <td>{appt.time}</td>
                    <td>
                      <span className={`status ${appt.status}`}>{appt.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title="Schedule Appointment" open={modalOpen} onClose={() => setModalOpen(false)}>
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
            Doctor
            <input name="doctorName" defaultValue={user?.name} />
          </label>
          <label>
            Hospital
            <input name="hospitalName" defaultValue={user?.organization} />
          </label>
          <label>
            Type
            <input name="type" placeholder="General Checkup" />
          </label>
          <label>
            Date *
            <input name="date" type="date" required />
          </label>
          <label>
            Time *
            <input name="time" placeholder="10:00 AM" required />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Schedule
          </button>
        </form>
      </Modal>
    </>
  );
}
