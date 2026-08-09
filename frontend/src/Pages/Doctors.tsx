import { useEffect, useState } from 'react';
import { Star, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Doctor, Hospital } from '../Types';

export default function Doctors() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [formModal, setFormModal] = useState<'new' | Doctor | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = async () => {
    const [d, h] = await Promise.all([api.getDoctors(), api.getHospitals()]);
    setDoctors(d);
    setHospitals(h);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name'),
      specialty: form.get('specialty'),
      hospitalId: form.get('hospitalId') || undefined
    };
    try {
      if (formModal && formModal !== 'new') {
        await api.updateDoctor(formModal.id, data);
      } else {
        await api.createDoctor(data);
      }
      setFormModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save doctor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor: Doctor) => {
    if (!confirm(`Remove Dr. ${doctor.name} from the directory?`)) return;
    try {
      await api.deleteDoctor(doctor.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete doctor');
    }
  };

  const editing = formModal && formModal !== 'new' ? formModal : null;

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link-header">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Doctors</h1>
          <p>Specialists across the Sympra network</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={() => setFormModal('new')}>
            <Plus size={18} /> Add Doctor
          </button>
        )}
      </div>
      <section className="doctor-grid">
        {doctors.length === 0 ? (
          <p className="empty-cell">No doctors yet</p>
        ) : (
          doctors.map((doctor) => (
            <article key={doctor.id} className="doctor-card">
              <img src={doctor.avatar} alt={doctor.name} />
              <div>
                <strong>{doctor.name}</strong>
                <p>{doctor.specialty}</p>
                <span className="rating">
                  <Star size={14} /> {doctor.rating}
                </span>
              </div>
              {isAdmin && (
                <div className="card-actions">
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Edit ${doctor.name}`}
                    onClick={() => setFormModal(doctor)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Delete ${doctor.name}`}
                    onClick={() => handleDelete(doctor)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </section>

      <Modal
        title={editing ? `Edit Dr. ${editing.name}` : 'Add Doctor'}
        open={Boolean(formModal)}
        onClose={() => setFormModal(null)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="full-width">
            Name *
            <input name="name" defaultValue={editing?.name} placeholder="Dr. Jane Uwase" required />
          </label>
          <label>
            Specialty *
            <input name="specialty" defaultValue={editing?.specialty} placeholder="Cardiology" required />
          </label>
          <label>
            Facility
            <select name="hospitalId" defaultValue={editing?.hospitalId || ''}>
              <option value="">Unassigned</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            {editing ? 'Save Changes' : 'Add Doctor'}
          </button>
        </form>
      </Modal>
    </>
  );
}
