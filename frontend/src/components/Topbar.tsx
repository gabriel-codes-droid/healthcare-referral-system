import { Bell, CalendarDays, ChevronDown, LogOut, Search, Sun, Moon, X, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type Props = {
  onMenuToggle?: () => void;
};

export default function Topbar({ onMenuToggle }: Props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const notifications = [
    { id: 1, message: 'New referral received for John Cooper', time: '5 min ago', unread: true },
    { id: 2, message: 'Appointment confirmed with Dr. Wilson', time: '1 hour ago', unread: true },
    { id: 3, message: 'Lab results uploaded for Jane Smith', time: '2 hours ago', unread: false }
  ];

  // Safely filters unread items to protect against unexpected array mutations
  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>
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
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadNotificationsCount > 0 && <span>{unreadNotificationsCount}</span>}
        </button>
        {/* Messages button - commented out as it's not necessary
        <button
          type="button"
          className="icon-button"
          onClick={() => setShowMessages(!showMessages)}
          aria-label="Messages"
        >
          <MessageSquare size={18} />
          {unreadMessagesCount > 0 && <span>{unreadMessagesCount}</span>}
        </button>
        */}
        <div className="profile">
          <img 
            src={user?.avatar || `https://ui-avatars.com{encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`} 
            alt={user?.name || "User profile"} 
          />
          <div>
            <strong>{user?.name || 'Guest User'}</strong>
            <p>{user?.role === 'admin' ? 'Super Admin' : (user?.organization || 'General')}</p>
          </div>
          <button type="button" className="logout-btn" onClick={logout} aria-label="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {showNotifications && (
        <div className="dropdown-panel notifications-panel">
          <div className="dropdown-header">
            <h3>Notifications</h3>
            <button onClick={() => setShowNotifications(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="dropdown-content">
            {notifications.length === 0 ? (
              <p className="empty-text">No notifications</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`notification-item ${notif.unread ? 'unread' : ''}`}>
                  <p>{notif.message}</p>
                  <small>{notif.time}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}