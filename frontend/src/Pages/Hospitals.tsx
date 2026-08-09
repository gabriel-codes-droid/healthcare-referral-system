import { useEffect, useState } from 'react';
import { Building2, FlaskConical, Stethoscope, ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Hospital } from '../Types';

const icons = {
  hospital: Building2,
  clinic: Stethoscope,
  laboratory: FlaskConical
};

export default function Hospitals() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [formModal, setFormModal] = useState<'new' | Hospital | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'admin';

  const load = () => api.getHospitals().then(setHospitals).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const data = {
      name: form.get('name'),
      type: form.get('type'),
      location: form.get('location')
    };
    try {
      if (formModal && formModal !== 'new') {
        await api.updateHospital(formModal.id, data);
      } else {
        await api.createHospital(data);
      }
      setFormModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save facility');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hospital: Hospital) => {
    if (!confirm(`Remove ${hospital.name}? This also removes doctors assigned to it.`)) return;
    try {
      await api.deleteHospital(hospital.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete facility');
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
          <h1>Hospitals & Clinics</h1>
          <p>Network facilities for referrals and care</p>
        </div>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={() => setFormModal('new')}>
            <Plus size={18} /> Add Facility
          </button>
        )}
      </div>
      <section className="hospital-grid">
        {hospitals.length === 0 ? (
          <p className="empty-cell">No facilities yet</p>
        ) : (
          hospitals.map((hospital) => {
            const Icon = icons[hospital.type];
            return (
              <article key={hospital.id} className="hospital-card">
                <span className="hospital-icon">
                  <Icon size={24} />
                </span>
                <div>
                  <strong>{hospital.name}</strong>
                  <p className="capitalize">{hospital.type}</p>
                  <small>{hospital.location}</small>
                </div>
                {isAdmin && (
                  <div className="card-actions">
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Edit ${hospital.name}`}
                      onClick={() => setFormModal(hospital)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Delete ${hospital.name}`}
                      onClick={() => handleDelete(hospital)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      <Modal
        title={editing ? `Edit ${editing.name}` : 'Add Facility'}
        open={Boolean(formModal)}
        onClose={() => setFormModal(null)}
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="full-width">
            Name *
            <input name="name" defaultValue={editing?.name} required />
          </label>
          <label>
            Type *
            <select name="type" defaultValue={editing?.type || 'hospital'} required>
              <option value="hospital">Hospital</option>
              <option value="clinic">Clinic</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </label>
          <label>
            Location *
            <input name="location" defaultValue={editing?.location} placeholder="City, district..." required />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            {editing ? 'Save Changes' : 'Add Facility'}
          </button>
        </form>
      </Modal>
    </>
  );
}
