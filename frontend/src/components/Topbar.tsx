import { Bell, CalendarDays, ChevronDown, LogOut, MessageSquare, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="topbar">
      <label className="search-box">
        <Search size={18} />
        <input placeholder="Search patients, appointments..." />
        <kbd>Ctrl K</kbd>
      </label>

      <div className="topbar-actions">
        <button type="button" className="date-button">
          <CalendarDays size={17} />
          {today}
          <ChevronDown size={16} />
        </button>
        <button type="button" className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <span>3</span>
        </button>
        <button type="button" className="icon-button" aria-label="Messages">
          <MessageSquare size={18} />
          <span>5</span>
        </button>
        <div className="profile">
          <img src={user?.avatar || 'https://i.pravatar.cc/80?img=13'} alt={user?.name} />
          <div>
            <strong>{user?.name}</strong>
            <p>{user?.role === 'admin' ? 'Super Admin' : user?.organization}</p>
          </div>
          <button type="button" className="logout-btn" onClick={logout} aria-label="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
