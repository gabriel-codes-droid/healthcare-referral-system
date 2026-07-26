import { NavLink } from 'react-router-dom';
import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FlaskConical,
  Home,
  Settings,
  Stethoscope,
  Users,
  X
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
  { label: 'Settings', icon: Settings, path: '/settings' }
];

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: Props) {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
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
                onClick={() => {
                  if (isOpen && onClose) onClose();
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <label className="mode-toggle">
          <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
        </label>
      </aside>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}
    </>
  );
}
