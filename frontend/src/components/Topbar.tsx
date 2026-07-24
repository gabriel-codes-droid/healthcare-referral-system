import { Bell, CalendarDays, ChevronDown, LogOut, MessageSquare, Search, Sun, Moon, X, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  const messages = [
    { id: 1, sender: 'Dr. Wilson', message: 'Patient is ready for referral', time: '10 min ago', unread: true },
    { id: 2, sender: 'City Hospital', message: 'Appointment slot available', time: '30 min ago', unread: true },
    { id: 3, sender: 'Metro Lab', message: 'Test results pending review', time: '1 hour ago', unread: false }
  ];

  // Safely filters unread items to protect against unexpected array mutations
  const unreadNotificationsCount = notifications.filter(n => n.unread).length;
  const unreadMessagesCount = messages.filter(m => m.unread).length;

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
        <button
          type="button"
          className="icon-button"
          onClick={() => setShowMessages(!showMessages)}
          aria-label="Messages"
        >
          <MessageSquare size={18} />
          {unreadMessagesCount > 0 && <span>{unreadMessagesCount}</span>}
        </button>
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

      {showMessages && (
        <div className="dropdown-panel messages-panel">
          <div className="dropdown-header">
            <h3>Messages</h3>
            <button onClick={() => setShowMessages(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="dropdown-content">
            {messages.length === 0 ? (
              <p className="empty-text">No messages</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`message-item ${msg.unread ? 'unread' : ''}`}>
                  <strong>{msg.sender}</strong>
                  <p>{msg.message}</p>
                  <small>{msg.time}</small>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}