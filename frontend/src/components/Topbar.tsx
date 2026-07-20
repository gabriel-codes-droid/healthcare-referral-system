import { Bell, CalendarDays, ChevronDown, MessageSquare, Search } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="topbar">
      <label className="search-box">
        <Search size={18} />
        <input placeholder="Search patients, appointments..." />
        <kbd>Ctrl K</kbd>
      </label>

      <div className="topbar-actions">
        <button className="date-button">
          <CalendarDays size={17} />
          May 22, 2025
          <ChevronDown size={16} />
        </button>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <span>3</span>
        </button>
        <button className="icon-button" aria-label="Messages">
          <MessageSquare size={18} />
          <span>5</span>
        </button>
        <div className="profile">
          <img src="https://i.pravatar.cc/80?img=13" alt="Dr. Robert Fox" />
          <div>
            <strong>Dr. Robert Fox</strong>
            <p>Super Admin</p>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}
