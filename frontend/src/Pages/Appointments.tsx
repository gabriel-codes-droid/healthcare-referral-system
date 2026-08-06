import { useEffect, useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Appointment, Doctor, Patient } from '../Types';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [a, p, d] = await Promise.all([api.getAppointments(), api.getPatients(), api.getDoctors()]);
    setAppointments(a);
    setPatients(p);
    setDoctors(d);
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
        doctorId: form.get('doctorId'),
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
  const calendarDays = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() + index); return date; });

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

      <section className="panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-header"><h2>7-day calendar</h2></div>
        <div className="table-wrap"><table><thead><tr>{calendarDays.map(day => <th key={day.toISOString()}>{day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</th>)}</tr></thead><tbody><tr>{calendarDays.map(day => { const key = day.toISOString().slice(0, 10); const daily = appointments.filter(a => new Date(a.date).toISOString().slice(0, 10) === key); return <td key={key} style={{ verticalAlign: 'top', minWidth: '130px' }}>{daily.length ? daily.map(a => <div className="result-badge" key={a.id}>{a.time}<br/>{a.patientName}<br/>{a.doctorName}</div>) : <small className="empty-cell">Available</small>}</td>; })}</tr></tbody></table></div>
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
            <select name="doctorId" onChange={(e) => { const date = (e.currentTarget.form?.elements.namedItem('date') as HTMLInputElement)?.value; if (e.target.value && date) api.getAvailability(e.target.value, date).then(x => setAvailableSlots(x.slots)); }}>
              <option value="">{user?.name || 'Select doctor'}</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>)}
            </select>
          </label>
          <input type="hidden" name="doctorName" value={user?.name || ''} />
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
            <input name="time" type="time" required />
          </label>
          {availableSlots.length > 0 && <p className="form-hint full-width">Available: {availableSlots.join(', ')}</p>}
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Schedule
          </button>
        </form>
      </Modal>
    </>
  );
}
