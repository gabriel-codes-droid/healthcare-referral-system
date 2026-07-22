type Props = {
  status: Record<string, number>;
};

const colors: Record<string, string> = {
  pending: '#3b82f6',
  accepted: '#10b981',
  rejected: '#ef4444',
  cancelled: '#f59e0b',
  completed: '#8b5cf6'
};

export default function ReferralStatusChart({ status }: Props) {
  const entries = Object.entries(status).filter(([, count]) => count > 0);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;

  let offset = 0;
  const segments = entries.map(([key, count]) => {
    const pct = (count / total) * 100;
    const segment = { key, count, pct, offset, color: colors[key] || '#64748b' };
    offset += pct;
    return segment;
  });

  const gradient =
    segments.length === 0
      ? 'conic-gradient(#334155 0 100%)'
      : `conic-gradient(${segments.map((s) => `${s.color} ${s.offset}% ${s.offset + s.pct}%`).join(', ')})`;

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <h2>Referral Status</h2>
      </div>
      <div className="donut-wrap">
        <div className="donut" style={{ background: gradient }}>
          <div className="donut-hole">
            <strong>{total}</strong>
            <span>Total</span>
          </div>
        </div>
        <ul className="legend">
          {entries.map(([key, count]) => (
            <li key={key}>
              <span className="dot" style={{ background: colors[key] }} />
              <span className="capitalize">{key}</span>
              <strong>
                {count} ({((count / total) * 100).toFixed(1)}%)
              </strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
