import { NavLink } from 'react-router-dom';
import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileBarChart,
  FlaskConical,
  Home,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES, type Lang } from '../i18n/translations';

const navItems = [
  { key: 'nav.dashboard', icon: Home, path: '/', roles: ['admin', 'clinic', 'hospital', 'lab'] },
  { key: 'nav.patients', icon: Users, path: '/patients', roles: ['admin', 'clinic', 'hospital', 'lab'] },
  { key: 'nav.appointments', icon: CalendarDays, path: '/appointments', roles: ['admin', 'clinic', 'hospital'] },
  { key: 'nav.referrals', icon: ClipboardList, path: '/referrals', roles: ['admin', 'clinic', 'hospital'] },
  { key: 'nav.doctors', icon: Stethoscope, path: '/doctors', roles: ['admin', 'clinic', 'hospital'] },
  { key: 'nav.hospitals', icon: Building2, path: '/hospitals', roles: ['admin', 'clinic', 'hospital'] },
  { key: 'nav.laboratories', icon: FlaskConical, path: '/laboratories', roles: ['admin', 'clinic', 'hospital', 'lab'] },
  { key: 'nav.billing', icon: CreditCard, path: '/billing', roles: ['admin', 'clinic', 'hospital', 'lab'] },
  { key: 'nav.reports', icon: FileBarChart, path: '/reports', roles: ['admin', 'clinic', 'hospital', 'lab'] },
  { key: 'nav.auditLog', icon: ShieldCheck, path: '/audit-logs', roles: ['admin'] },
  { key: 'nav.settings', icon: Settings, path: '/settings', roles: ['admin', 'clinic', 'hospital', 'lab'] }
];

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ isOpen = false, onClose }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const visibleItems = navItems.filter((item) => !user || item.roles.includes(user.role));

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
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                key={item.key}
                onClick={() => {
                  if (isOpen && onClose) onClose();
                }}
              >
                <Icon size={18} />
                <span>{t(item.key)}</span>
              </NavLink>
            );
          })}
        </nav>

        <label className="mode-toggle">
          <span>{t('common.language')}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Lang)}
            className="lang-select"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

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
