import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ClipboardList,
  FlaskConical,
  Users
} from 'lucide-react';
import StatCard from '../components/StatCard';
import ReferralStatusChart from '../components/ReferralStatusChart';
import ReferralTable from '../components/ReferralTable';
import AppointmentList from '../components/AppointmentList';
import QuickActions from '../components/QuickActions';
import TopDoctors from '../components/TopDoctors';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { DashboardStats, Hospital, Patient } from '../Types';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [modal, setModal] = useState<'patient' | 'referral' | 'appointment' | 'lab' | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [statsData, patientsData, hospitalsData] = await Promise.all([
      api.getStats(),
      api.getPatients(),
      api.getHospitals()
    ]);
    setStats(statsData);
    setPatients(patientsData);
    setHospitals(hospitalsData);
  };

  useEffect(() => {
    loadData().catch(console.error);
  }, []);

  const handleCreatePatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
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
      setModal(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create patient');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const form = new FormData(e.currentTarget);
    try {
      const patientId = form.get('patientId') as string;
      await api.recordVisit(patientId, {
        chiefComplaint: form.get('chiefComplaint'),
        diagnosis: form.get('diagnosis'),
        notes: form.get('notes'),
        referralNeeded: true
      });
      await api.createReferral({
        patientId,
        toOrganization: form.get('toOrganization'),
        reason: form.get('reason'),
        priority: form.get('priority'),
        notes: form.get('notes')
      });
      setModal(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create referral');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
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
      setModal(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleLabRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.requestLabTest({
        patientId: form.get('patientId'),
        testType: form.get('testType'),
        labName: form.get('labName'),
        notes: form.get('notes')
      });
      setModal(null);
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to request lab test');
    } finally {
      setSaving(false);
    }
  };

  const hospitalOptions = hospitals.filter((h) => h.type === 'hospital');
  const labOptions = hospitals.filter((h) => h.type === 'laboratory');

  return (
    <>
      <section className="welcome-row">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[1] || user?.name}!</h1>
          <p>Manage referrals, appointments, and patient care from one dashboard.</p>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Total Patients"
          value={String(stats?.totalPatients ?? 0)}
          change="+12%"
          tone="blue"
          icon={Users}
          points={[12, 18, 14, 22, 19, 26, 24]}
        />
        <StatCard
          title="Total Referrals"
          value={String(stats?.totalReferrals ?? 0)}
          change="+8%"
          tone="teal"
          icon={ClipboardList}
          points={[8, 12, 10, 16, 14, 18, 20]}
        />
        <StatCard
          title="Appointments"
          value={String(stats?.totalAppointments ?? 0)}
          change="+15%"
          tone="green"
          icon={CalendarDays}
          points={[6, 9, 8, 12, 11, 15, 14]}
        />
        <StatCard
          title="Labs Completed"
          value={String(stats?.labsCompleted ?? 0)}
          change="+10%"
          tone="amber"
          icon={FlaskConical}
          points={[4, 6, 5, 8, 7, 10, 9]}
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-main">
          <ReferralStatusChart status={stats?.referralStatus ?? {}} />
          <ReferralTable
            referrals={stats?.recentReferrals ?? []}
            onViewAll={() => navigate('/referrals')}
          />
        </div>
        <aside className="dashboard-side">
          <QuickActions
            onNewReferral={() => setModal('referral')}
            onNewAppointment={() => setModal('appointment')}
            onAddPatient={() => setModal('patient')}
            onLabRequest={() => setModal('lab')}
          />
          <AppointmentList appointments={stats?.upcomingAppointments ?? []} />
          <TopDoctors doctors={stats?.topDoctors ?? []} />
        </aside>
      </section>

      <Modal title="Register Patient" open={modal === 'patient'} onClose={() => setModal(null)}>
        <form className="form-grid" onSubmit={handleCreatePatient}>
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
          {formError && <p className="form-error full-width">{formError}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Register Patient
          </button>
        </form>
      </Modal>

      <Modal title="Create Referral" open={modal === 'referral'} onClose={() => setModal(null)} wide>
        <form className="form-grid" onSubmit={handleCreateReferral}>
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
            <input name="reason" placeholder="e.g. Cardiology Consultation" required />
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
          {formError && <p className="form-error full-width">{formError}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Create Referral
          </button>
        </form>
      </Modal>

      <Modal title="Schedule Appointment" open={modal === 'appointment'} onClose={() => setModal(null)}>
        <form className="form-grid" onSubmit={handleCreateAppointment}>
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
          {formError && <p className="form-error full-width">{formError}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Schedule
          </button>
        </form>
      </Modal>

      <Modal title="Request Lab Test" open={modal === 'lab'} onClose={() => setModal(null)}>
        <form className="form-grid" onSubmit={handleLabRequest}>
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
            Test Type *
            <input name="testType" placeholder="Blood Test, MRI, etc." required />
          </label>
          <label>
            Laboratory
            <select name="labName" defaultValue="Metro Laboratory">
              {labOptions.map((l) => (
                <option key={l.id} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="full-width">
            Notes
            <textarea name="notes" rows={3} />
          </label>
          {formError && <p className="form-error full-width">{formError}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Request Test
          </button>
        </form>
      </Modal>
    </>
  );
}
