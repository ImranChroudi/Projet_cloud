import { useAuth } from '../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <div className="topbar-search">
          <Search size={18} />
          <input type="text" placeholder="Rechercher..." />
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-notif-wrapper">
          <button
            className="topbar-icon-btn"
            onClick={() => setShowNotif(!showNotif)}
          >
            <Bell size={20} />
            <span className="notif-badge">3</span>
          </button>
          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>Notifications</h4>
              </div>
              <div className="notif-item unread">
                <div className="notif-dot"></div>
                <div>
                  <p>Nouvelle tâche assignée à vous</p>
                  <span>Il y a 5 min</span>
                </div>
              </div>
              <div className="notif-item unread">
                <div className="notif-dot"></div>
                <div>
                  <p>Commentaire sur &quot;Design UI&quot;</p>
                  <span>Il y a 20 min</span>
                </div>
              </div>
              <div className="notif-item">
                <div>
                  <p>Projet &quot;App Mobile&quot; terminé</p>
                  <span>Il y a 1h</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-user">
          <div className="topbar-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="topbar-user-info">
            <span className="topbar-username">{user?.username}</span>
            <span className="topbar-role">{user?.role}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
