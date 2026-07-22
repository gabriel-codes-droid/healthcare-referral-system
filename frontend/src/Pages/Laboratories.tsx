import { useEffect, useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Hospital, LabTest, Patient } from '../Types';

export default function Laboratories() {
  const { user } = useAuth();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [requestModal, setRequestModal] = useState(false);
  const [uploadModal, setUploadModal] = useState<LabTest | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [t, p, h] = await Promise.all([api.getLabTests(), api.getPatients(), api.getHospitals()]);
    setTests(t);
    setPatients(p);
    setHospitals(h);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const canRequest = ['admin', 'clinic', 'hospital'].includes(user?.role || '');
  const canUpload = ['admin', 'lab'].includes(user?.role || '');

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.requestLabTest({
        patientId: form.get('patientId'),
        testType: form.get('testType'),
        labName: form.get('labName'),
        notes: form.get('notes')
      });
      setRequestModal(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadModal) return;
    setSaving(true);
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.uploadLabResult({
        labTestId: uploadModal.id,
        findings: form.get('findings'),
        summary: form.get('summary'),
        fileName: form.get('fileName')
      });
      setUploadModal(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const labOptions = hospitals.filter((h) => h.type === 'laboratory');

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Laboratories</h1>
          <p>Request lab tests and upload results</p>
        </div>
        {canRequest && (
          <button type="button" className="btn-primary" onClick={() => setRequestModal(true)}>
            <Plus size={18} /> Request Test
          </button>
        )}
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Test Type</th>
                <th>Lab</th>
                <th>Requested By</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No lab tests yet
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id}>
                    <td>{test.patientName}</td>
                    <td>{test.testType}</td>
                    <td>{test.labName}</td>
                    <td>{test.requestedBy}</td>
                    <td>
                      <span className={`status ${test.status}`}>{test.status}</span>
                    </td>
                    <td>{new Date(test.requestedAt).toLocaleDateString()}</td>
                    <td>
                      {canUpload && test.status === 'pending' && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => setUploadModal(test)}
                        >
                          <Upload size={14} /> Upload Results
                        </button>
                      )}
                      {test.results && test.results.length > 0 && (
                        <span className="result-badge">Results uploaded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {tests.some((t) => t.results && t.results.length > 0) && (
        <section className="panel" style={{ marginTop: '1.5rem' }}>
          <div className="panel-header">
            <h2>Lab Results</h2>
          </div>
          <div className="results-list">
            {tests.flatMap((test) =>
              (test.results || []).map((result) => (
                <article key={result.id} className="result-card">
                  <div>
                    <strong>{result.patientName}</strong>
                    <p>{result.testType}</p>
                  </div>
                  <div>
                    <p>{result.summary || result.findings}</p>
                    <small>
                      Uploaded by {result.uploadedBy} on{' '}
                      {new Date(result.uploadedAt).toLocaleDateString()}
                    </small>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}

      <Modal title="Request Lab Test" open={requestModal} onClose={() => setRequestModal(false)}>
        <form className="form-grid" onSubmit={handleRequest}>
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
            <input name="testType" placeholder="Blood Test, MRI, X-Ray..." required />
          </label>
          <label>
            Laboratory
            <select name="labName">
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
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Submit Request
          </button>
        </form>
      </Modal>

      <Modal
        title={`Upload Results — ${uploadModal?.testType}`}
        open={Boolean(uploadModal)}
        onClose={() => setUploadModal(null)}
      >
        <form className="form-grid" onSubmit={handleUpload}>
          <label className="full-width">
            Findings *
            <textarea name="findings" rows={4} placeholder="Detailed test findings..." required />
          </label>
          <label className="full-width">
            Summary
            <input name="summary" placeholder="Brief summary for the doctor" />
          </label>
          <label>
            File Name
            <input name="fileName" defaultValue="results.pdf" />
          </label>
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Upload Results
          </button>
        </form>
      </Modal>
    </>
  );
}
