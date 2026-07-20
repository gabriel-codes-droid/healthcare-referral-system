import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  tone: 'blue' | 'green' | 'teal' | 'amber';
  icon: LucideIcon;
  points: number[];
};

export default function StatCard({ title, value, change, tone, icon: Icon, points }: StatCardProps) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 48 - ((point - min) / (max - min || 1)) * 36;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={18} />
        </span>
        <span>{title}</span>
      </div>
      <div className="stat-value">
        <strong>{value}</strong>
        <span>{change}</span>
      </div>
      <p>vs last month</p>
      <svg viewBox="0 0 100 52" className="sparkline" role="img" aria-label={`${title} trend`}>
        <path d={path} />
      </svg>
    </article>
  );
}
