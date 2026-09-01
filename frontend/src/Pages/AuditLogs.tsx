import { useEffect, useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { AuditLogEntry } from '../Types';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAuditLogs().then(setLogs).catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit logs'));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/settings" className="back-link-header">
            <ArrowLeft size={16} /> Back to Settings
          </Link>
          <h1>Audit Log</h1>
          <p>Every sensitive action taken on patient data, for compliance review</p>
        </div>
      </div>

      <section className="panel" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <ShieldCheck size={18} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Data is protected by Firebase security rules and encrypted in transit. This log shows the most recent 100 events.
        </span>
      </section>

      {error && <p className="form-error">{error}</p>}

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Organization</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-cell">No audit events yet</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.userName} <span style={{ color: 'var(--text-muted)' }}>({log.userRole})</span></td>
                    <td>{log.userOrg}</td>
                    <td>{log.action}</td>
                    <td>{log.targetType} {log.targetId ? `#${log.targetId.slice(-6)}` : ''}</td>
                    <td>{log.details || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
