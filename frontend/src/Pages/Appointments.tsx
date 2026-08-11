import { useEffect, useMemo, useState } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { api } from '../services/api';
import type { Appointment, Patient, Doctor } from '../Types';

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const load = async () => {
    const [a, p, d] = await Promise.all([api.getAppointments(), api.getPatients(), api.getDoctors()]);
    setAppointments(a);
    setPatients(p);
    setDoctors(d);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedTime('');
    api
      .getAvailability(selectedDoctorId, selectedDate)
      .then((res) => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctorId, selectedDate]);

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    appointments.forEach((appt) => {
      const key = new Date(appt.date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      groups.set(key, [...(groups.get(key) || []), appt]);
    });
    return Array.from(groups.entries()).sort(
      (a, b) => new Date(b[1][0].date).getTime() - new Date(a[1][0].date).getTime()
    );
  }, [appointments]);

  const resetForm = () => {
    setSelectedDoctorId('');
    setSelectedDate('');
    setSelectedTime('');
    setSlots([]);
    setError('');
  };

  const validateAppointment = (formData: FormData): string | null => {
    const type = (formData.get('type') as string)?.trim().toLowerCase();
    const validTypes = ['consultation', 'follow-up', 'procedure'];
    if (!type || !validTypes.includes(type)) {
      return 'Type must be one of: consultation, follow-up, procedure';
    }

    if (!selectedDate) {
      return 'Please select a date';
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(selectedDate)) {
      return 'Date format is invalid';
    }

    if (!selectedTime) {
      return 'Please select a time slot';
    }

    return null;
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateAppointment(new FormData(e.currentTarget));
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedTime) {
      setError('Pick an available time slot');
      return;
    }
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.createAppointment({
        patientId: form.get('patientId'),
        doctorId: selectedDoctorId || undefined,
        type: form.get('type'),
        date: selectedDate,
        time: selectedTime
      });
      setModalOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link-header" style={{ fontWeight: 500, fontSize: '0.9rem' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Appointments</h1>
          <p>Scheduled visits from accepted referrals and direct bookings</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New Appointment
        </button>
      </div>

      {groupedByDate.length === 0 ? (
        <section className="panel" style={{ padding: '1.5rem' }}>
          <p className="empty-text">No appointments scheduled</p>
        </section>
      ) : (
        groupedByDate.map(([dayLabel, dayAppointments]) => (
          <div key={dayLabel} className="day-group">
            <h3>{dayLabel}</h3>
            <section className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Doctor</th>
                      <th>Hospital</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayAppointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((appt) => (
                        <tr key={appt.id}>
                          <td>{appt.patientName}</td>
                          <td>{appt.type}</td>
                          <td>{appt.doctorName}</td>
                          <td>{appt.hospitalName}</td>
                          <td>{appt.time}</td>
                          <td>
                            <span className={`status ${appt.status}`}>{appt.status}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ))
      )}

      <Modal
        title="Schedule Appointment"
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
      >
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
            Type
            <input name="type" placeholder="General Checkup" defaultValue="consultation" />
          </label>
          <label>
            Doctor *
            <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} required>
              <option value="">Select doctor</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date *
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </label>
          <label className="full-width">
            Available Time Slots *
            {!selectedDoctorId || !selectedDate ? (
              <p className="empty-text" style={{ margin: '0.4rem 0 0' }}>
                Choose a doctor and date to see availability
              </p>
            ) : loadingSlots ? (
              <p style={{ margin: '0.4rem 0 0' }}>Loading availability...</p>
            ) : (
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={slot.time}
                    className={`slot-btn ${selectedTime === slot.time ? 'selected' : ''}`}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="button" className="btn-secondary full-width" onClick={() => { setModalOpen(false); resetForm(); }}>
            Cancel
          </button>
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Schedule
          </button>
        </form>
      </Modal>
    </>
  );
}
