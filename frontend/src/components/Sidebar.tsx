import { NavLink } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FlaskConical,
  Home,
  MessageSquare,
  Settings,
  Stethoscope,
  Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/' },
  { label: 'Patients', icon: Users, path: '/patients' },
  { label: 'Appointments', icon: CalendarDays, path: '/appointments' },
  { label: 'Referrals', icon: ClipboardList, path: '/referrals' },
  { label: 'Doctors', icon: Stethoscope, path: '/doctors' },
  { label: 'Hospitals', icon: Building2, path: '/hospitals' },
  { label: 'Laboratories', icon: FlaskConical, path: '/laboratories' },
  { label: 'Reports', icon: FileBarChart, path: '/reports' },
  { label: 'Messages', icon: MessageSquare, path: '/messages' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Settings', icon: Settings, path: '/settings' }
];

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <Activity size={20} />
        </span>
        <span>Sympra</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              key={item.label}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="upgrade-panel">
        <Bell size={18} />
        <strong>Upgrade Plan</strong>
        <p>Unlock analytics, hospital routing, and advanced reporting tools.</p>
        <button type="button">Upgrade Now</button>
      </div>

      <label className="mode-toggle">
        <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
        <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
      </label>
    </aside>
  );
}
