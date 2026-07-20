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

const navItems = [
  { label: 'Dashboard', icon: Home, active: true },
  { label: 'Patients', icon: Users },
  { label: 'Appointments', icon: CalendarDays },
  { label: 'Referrals', icon: ClipboardList },
  { label: 'Doctors', icon: Stethoscope },
  { label: 'Hospitals', icon: Building2 },
  { label: 'Laboratories', icon: FlaskConical },
  { label: 'Reports', icon: FileBarChart },
  { label: 'Messages', icon: MessageSquare },
  { label: 'Billing', icon: CreditCard },
  { label: 'Settings', icon: Settings }
];

export default function Sidebar() {
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
            <button className={`nav-item ${item.active ? 'active' : ''}`} key={item.label}>
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="upgrade-panel">
        <Bell size={18} />
        <strong>Upgrade Plan</strong>
        <p>Unlock analytics, hospital routing, and advanced reporting tools.</p>
        <button>Upgrade Now</button>
      </div>

      <label className="mode-toggle">
        <span>Dark Mode</span>
        <input type="checkbox" defaultChecked />
      </label>
    </aside>
  );
}
