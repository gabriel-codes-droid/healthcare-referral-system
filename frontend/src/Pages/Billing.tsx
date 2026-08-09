import { useEffect, useState } from 'react';
import { Plus, ArrowLeft, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { api } from '../services/api';
import type { Invoice, Patient } from '../Types';

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [summary, setSummary] = useState<{ collected: number; outstanding: number; count: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payerType, setPayerType] = useState<'self-pay' | 'insurance'>('self-pay');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [inv, pts, sum] = await Promise.all([api.getInvoices(), api.getPatients(), api.getBillingSummary()]);
    setInvoices(inv);
    setPatients(pts);
    setSummary(sum);
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
      await api.createInvoice({
        patientId: form.get('patientId'),
        serviceType: form.get('serviceType'),
        description: form.get('description'),
        amount: form.get('amount'),
        payerType: form.get('payerType'),
        insuranceProvider: form.get('insuranceProvider'),
        insurancePolicyNumber: form.get('insurancePolicyNumber')
      });
      setModalOpen(false);
      setPayerType('self-pay');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (invoice: Invoice) => {
    try {
      await api.updateInvoiceStatus(invoice.id, 'paid');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update invoice');
    }
  };

  const markCancelled = async (invoice: Invoice) => {
    if (!confirm(`Cancel invoice for ${invoice.patientName}?`)) return;
    try {
      await api.updateInvoiceStatus(invoice.id, 'cancelled');
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update invoice');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link-header">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Billing</h1>
          <p>Payment tracking for services rendered</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> New Invoice
        </button>
      </div>

      {summary && (
        <section className="billing-summary" style={{ marginBottom: '1.25rem' }}>
          <div className="panel billing-summary-card">
            <DollarSign size={22} />
            <div>
              <strong>{summary.collected.toLocaleString()} RWF</strong>
              <p>Collected</p>
            </div>
          </div>
          <div className="panel billing-summary-card">
            <DollarSign size={22} />
            <div>
              <strong>{summary.outstanding.toLocaleString()} RWF</strong>
              <p>Outstanding</p>
            </div>
          </div>
          <div className="panel billing-summary-card">
            <DollarSign size={22} />
            <div>
              <strong>{summary.count}</strong>
              <p>Total Invoices</p>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Description</th>
                <th>Payer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issued</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No invoices yet
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.patientName}</td>
                    <td>{inv.description}</td>
                    <td>
                      {inv.payerType === 'insurance' ? inv.insuranceProvider || 'Insurance' : 'Self-pay'}
                    </td>
                    <td>{formatAmount(inv.amount, inv.currency)}</td>
                    <td>
                      <span className={`status ${inv.status}`}>{inv.status}</span>
                    </td>
                    <td>{new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td>
                      {inv.status === 'pending' || inv.status === 'overdue' ? (
                        <div className="action-group">
                          <button type="button" className="btn-success btn-sm" onClick={() => markPaid(inv)}>
                            Mark Paid
                          </button>
                          <button type="button" className="btn-danger btn-sm" onClick={() => markCancelled(inv)}>
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="empty-text">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title="New Invoice" open={modalOpen} onClose={() => setModalOpen(false)}>
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
            Service Type
            <select name="serviceType" defaultValue="other">
              <option value="referral">Referral</option>
              <option value="appointment">Appointment</option>
              <option value="labTest">Lab Test</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="full-width">
            Description *
            <input name="description" placeholder="Consultation fee, lab panel, etc." required />
          </label>
          <label>
            Amount (RWF) *
            <input name="amount" type="number" min="0" step="1" required />
          </label>
          <label>
            Payer
            <select name="payerType" value={payerType} onChange={(e) => setPayerType(e.target.value as 'self-pay' | 'insurance')}>
              <option value="self-pay">Self-pay</option>
              <option value="insurance">Insurance</option>
            </select>
          </label>
          {payerType === 'insurance' && (
            <>
              <label>
                Insurance Provider
                <input name="insuranceProvider" placeholder="RSSB, RAMA, etc." />
              </label>
              <label>
                Policy Number
                <input name="insurancePolicyNumber" />
              </label>
            </>
          )}
          {error && <p className="form-error full-width">{error}</p>}
          <button type="submit" className="btn-primary full-width" disabled={saving}>
            Create Invoice
          </button>
        </form>
      </Modal>
    </>
  );
}
