import { NavLink } from 'react-router-dom';
import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  FlaskConical,
  Home,
  Settings,
  Stethoscope,
  Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', key: 'dashboard', icon: Home, path: '/' },
  { label: 'Patients', key: 'patients', icon: Users, path: '/patients' },
  { label: 'Appointments', key: 'appointments', icon: CalendarDays, path: '/appointments' },
  { label: 'Referrals', key: 'referrals', icon: ClipboardList, path: '/referrals' },
  { label: 'Doctors', key: 'doctors', icon: Stethoscope, path: '/doctors' },
  { label: 'Hospitals', key: 'hospitals', icon: Building2, path: '/hospitals' },
  { label: 'Laboratories', key: 'laboratories', icon: FlaskConical, path: '/laboratories' },
  { label: 'Consultations', key: 'consultations', icon: MessageCircle, path: '/messages' },
  { label: 'Reports', icon: FileBarChart, path: '/reports' },
  { label: 'Settings', key: 'settings', icon: Settings, path: '/settings' },
  { label: 'Offline sync', key: 'settings', icon: RefreshCw, path: '/sync' },
  { label: 'Compliance', key: 'settings', icon: ShieldCheck, path: '/compliance' }
];

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const visibleNav = navItems.filter((item) => {
    const role = user?.role;
    if (role === 'patient') return ['/', '/appointments', '/referrals', '/messages', '/settings', '/sync'].includes(item.path);
    if (role === 'lab') return ['/', '/laboratories', '/messages', '/settings', '/sync'].includes(item.path);
    if (role === 'clinic') return item.path !== '/compliance';
    if (role === 'hospital') return item.path !== '/compliance';
    return true;
  });

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
          {visibleNav.map((item) => {
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
                <span>{t(item.key as Parameters<typeof t>[0])}</span>
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
