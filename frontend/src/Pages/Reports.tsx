import { useEffect, useState } from 'react';
import { ArrowLeft, Users, ClipboardList, CalendarDays, FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '../components/StatCard';
import ReferralStatusChart from '../components/ReferralStatusChart';
import { api } from '../services/api';
import type { DashboardStats, LabTest } from '../Types';

export default function Reports() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getStats(), api.getLabTests()])
      .then(([s, tests]) => {
        setStats(s);
        setLabTests(tests);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reports'));
  }, []);

  const labStatusCounts = labTests.reduce<Record<string, number>>((acc, test) => {
    acc[test.status] = (acc[test.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link-header">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Reports</h1>
          <p>An overview of activity across patients, referrals, and labs</p>
        </div>
      </div>

      {error && <p className="form-error" style={{ marginBottom: '1rem' }}>{error}</p>}

      <section className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard title="Total Patients" value={String(stats?.totalPatients ?? 0)} change="" tone="blue" icon={Users} points={[]} />
        <StatCard title="Total Referrals" value={String(stats?.totalReferrals ?? 0)} change="" tone="teal" icon={ClipboardList} points={[]} />
        <StatCard title="Appointments" value={String(stats?.totalAppointments ?? 0)} change="" tone="green" icon={CalendarDays} points={[]} />
        <StatCard title="Labs Completed" value={String(stats?.labsCompleted ?? 0)} change="" tone="amber" icon={FlaskConical} points={[]} />
      </section>

      <ReferralStatusChart status={stats?.referralStatus ?? {}} />

      <section className="panel" style={{ padding: '1.25rem', marginTop: '1.25rem' }}>
        <div className="panel-header">
          <h2>Lab Tests by Status</h2>
        </div>
        {Object.keys(labStatusCounts).length === 0 ? (
          <p className="empty-text">No lab tests recorded yet</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Status</th><th>Count</th></tr>
              </thead>
              <tbody>
                {Object.entries(labStatusCounts).map(([status, count]) => (
                  <tr key={status}>
                    <td className="capitalize">{status}</td>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
