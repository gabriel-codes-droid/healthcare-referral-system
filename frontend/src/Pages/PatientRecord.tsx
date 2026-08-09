import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, X, FileText, Download, Trash2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Patient, Visit, Prescription, Attachment } from '../Types';

type Tab = 'overview' | 'visits' | 'prescriptions' | 'attachments';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PatientRecord() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [rxModal, setRxModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = ['admin', 'clinic', 'hospital'].includes(user?.role || '');
  const canUpload = ['admin', 'clinic', 'hospital', 'lab'].includes(user?.role || '');

  const load = async () => {
    if (!id) return;
    const [p, v, rx, att] = await Promise.all([
      api.getPatients().then((list) => list.find((x) => x.id === id) || null),
      api.getVisits(id),
      api.getPrescriptions(id),
      api.getAttachments(id)
    ]);
    setPatient(p);
    setVisits(v);
    setPrescriptions(rx);
    setAttachments(att);
  };

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const addAllergy = async () => {
    if (!patient || !allergyInput.trim()) return;
    const next = [...patient.allergies, allergyInput.trim()];
    setAllergyInput('');
    try {
      const updated = await api.updateAllergies(patient.id, next);
      setPatient(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update allergies');
    }
  };

  const removeAllergy = async (allergy: string) => {
    if (!patient) return;
    try {
      const updated = await api.updateAllergies(
        patient.id,
        patient.allergies.filter((a) => a !== allergy)
      );
      setPatient(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update allergies');
    }
  };

  const handlePrescribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.createPrescription(id, {
        medication: form.get('medication'),
        dosage: form.get('dosage'),
        frequency: form.get('frequency'),
        duration: form.get('duration'),
        notes: form.get('notes')
      });
      setRxModal(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;
    const form = new FormData(e.currentTarget);
    const file = form.get('file') as File;
    if (!file || file.size === 0) {
      setError('Choose a file to upload');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File exceeds the 5MB limit');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      await api.uploadAttachment(id, {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64
      });
      setUploadModal(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload attachment');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    if (!id) return;
    try {
      const full = await api.getAttachment(id, attachment.id);
      const link = document.createElement('a');
      link.href = `data:${full.mimeType};base64,${full.data}`;
      link.download = full.fileName;
      link.click();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!id || !confirm(`Delete ${attachment.fileName}?`)) return;
    try {
      await api.deleteAttachment(id, attachment.id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleExport = async () => {
    if (!id || !patient) return;
    try {
      const bundle = await api.exportPatientData(id);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${patient.name.replace(/\s+/g, '_')}_medical_record.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export patient data');
    }
  };

  const handleDeletePatient = async () => {
    if (!id || !patient) return;
    if (!confirm(`Permanently delete ${patient.name} and all associated records? This cannot be undone.`)) return;
    try {
      await api.deletePatient(id);
      navigate('/patients');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete patient');
    }
  };

  if (!patient) {
    return (
      <div className="page-header">
        <Link to="/patients" className="back-link-header">
          <ArrowLeft size={16} /> Back to Patients
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/patients" className="back-link-header">
            <ArrowLeft size={16} /> Back to Patients
          </Link>
          <h1>{patient.name}</h1>
          <p>{patient.email} · {patient.phone}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canEdit && (
            <button type="button" className="btn-secondary" onClick={handleExport}>
              <Download size={16} /> Export Data
            </button>
          )}
          {user?.role === 'admin' && (
            <button type="button" className="btn-danger" onClick={handleDeletePatient}>
              <Trash2 size={16} /> Delete Patient
            </button>
          )}
        </div>
      </div>

      <div className="record-tabs">
        <button type="button" className={`record-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          Overview
        </button>
        <button type="button" className={`record-tab ${tab === 'visits' ? 'active' : ''}`} onClick={() => setTab('visits')}>
          Visit History ({visits.length})
        </button>
        <button type="button" className={`record-tab ${tab === 'prescriptions' ? 'active' : ''}`} onClick={() => setTab('prescriptions')}>
          Prescriptions ({prescriptions.length})
        </button>
        <button type="button" className={`record-tab ${tab === 'attachments' ? 'active' : ''}`} onClick={() => setTab('attachments')}>
          Attachments ({attachments.length})
        </button>
      </div>

      {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}

      {tab === 'overview' && (
        <section className="panel" style={{ padding: '1.25rem' }}>
          <h2 style={{ marginTop: 0 }}>Patient Information</h2>
          <p><strong>Date of Birth:</strong> {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '—'}</p>
          <p><strong>Gender:</strong> {patient.gender || '—'}</p>
          <p><strong>Address:</strong> {patient.address || '—'}</p>
          <p><strong>Registered:</strong> {new Date(patient.registeredAt).toLocaleDateString()}</p>

          <h2>Allergies</h2>
          <div className="chip-list">
            {patient.allergies.length === 0 && <span className="empty-text">No known allergies recorded</span>}
            {patient.allergies.map((allergy) => (
              <span key={allergy} className="chip">
                {allergy}
                {canEdit && (
                  <button type="button" onClick={() => removeAllergy(allergy)} aria-label={`Remove ${allergy}`}>
                    <X size={12} />
                  </button>
                )}
              </span>
            ))}
          </div>
          {canEdit && (
            <div className="form-grid" style={{ marginTop: '0.75rem', maxWidth: '360px' }}>
              <label className="full-width">
                Add allergy
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={allergyInput}
                    onChange={(e) => setAllergyInput(e.target.value)}
                    placeholder="e.g. Penicillin"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addAllergy();
                      }
                    }}
                  />
                  <button type="button" className="btn-secondary btn-sm" onClick={addAllergy}>
                    Add
                  </button>
                </div>
              </label>
            </div>
          )}
        </section>
      )}

      {tab === 'visits' && (
        <section className="record-list">
          {visits.length === 0 ? (
            <p className="empty-text">No visits recorded yet</p>
          ) : (
            visits.map((visit) => (
              <article key={visit.id} className="record-item">
                <strong>{visit.chiefComplaint || 'Visit'}</strong>
                <p>Diagnosis: {visit.diagnosis || '—'}</p>
                {visit.notes && <p>{visit.notes}</p>}
                <small>
                  {visit.doctorName} · {visit.clinicName} · {new Date(visit.visitedAt).toLocaleString()}
                  {visit.referralNeeded ? ' · Referral requested' : ''}
                </small>
              </article>
            ))
          )}
        </section>
      )}

      {tab === 'prescriptions' && (
        <>
          {canEdit && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn-primary" onClick={() => setRxModal(true)}>
                <Plus size={18} /> New Prescription
              </button>
            </div>
          )}
          <section className="record-list">
            {prescriptions.length === 0 ? (
              <p className="empty-text">No prescriptions yet</p>
            ) : (
              prescriptions.map((rx) => (
                <article key={rx.id} className="record-item">
                  <strong>{rx.medication} — {rx.dosage}</strong>
                  <p>{[rx.frequency, rx.duration].filter(Boolean).join(' · ') || 'No schedule specified'}</p>
                  {rx.notes && <p>{rx.notes}</p>}
                  <small>{rx.prescribedBy} · {rx.prescribedByOrg} · {new Date(rx.prescribedAt).toLocaleString()}</small>
                </article>
              ))
            )}
          </section>
        </>
      )}

      {tab === 'attachments' && (
        <>
          {canUpload && (
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn-primary" onClick={() => setUploadModal(true)}>
                <Plus size={18} /> Upload File
              </button>
            </div>
          )}
          <section className="record-list">
            {attachments.length === 0 ? (
              <p className="empty-text">No attachments yet</p>
            ) : (
              attachments.map((att) => (
                <article key={att.id} className="record-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileText size={20} />
                  <div style={{ flex: 1 }}>
                    <strong>{att.fileName}</strong>
                    <p>{formatBytes(att.sizeBytes)}</p>
                    <small>{att.uploadedBy} · {new Date(att.uploadedAt).toLocaleString()}</small>
                  </div>
                  <button type="button" className="icon-button" aria-label={`Download ${att.fileName}`} onClick={() => handleDownload(att)}>
                    <Download size={16} />
                  </button>
                  {canEdit && (
                    <button type="button" className="icon-button" aria-label={`Delete ${att.fileName}`} onClick={() => handleDeleteAttachment(att)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </article>
              ))
            )}
          </section>
        </>
      )}

      <Modal title="New Prescription" open={rxModal} onClose={() => setRxModal(false)}>
        <form className="form-grid" onSubmit={handlePrescribe}>
          <label className="full-width">
            Medication *
            <input name="medication" required />
          </label>
          <label>
            Dosage *
            <input name="dosage" placeholder="500mg" required />
          </label>
          <label>
            Frequency
            <input name="frequency" placeholder="3x daily" />
          </label>
          <label>
            Duration
            <input name="duration" placeholder="7 days" />
          </label>
          <label className="full-width">
            Notes
            <textarea name="notes" rows={2} />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Save Prescription
          </button>
        </form>
      </Modal>

      <Modal title="Upload Attachment" open={uploadModal} onClose={() => setUploadModal(false)}>
        <form className="form-grid" onSubmit={handleUpload}>
          <label className="full-width">
            File (max 5MB)
            <input name="file" type="file" required />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Upload
          </button>
        </form>
      </Modal>
    </>
  );
}
