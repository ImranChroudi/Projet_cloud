import { useAuth } from '../context/AuthContext';
import { Bell, Search, Menu, FolderPlus, ListChecks, MessageSquare, FileIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import notifApi from '../api/notifApi';

const NOTIF_SOCKET_URL = 'http://localhost:3003';

// Notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    // Two-tone chime
    osc.frequency.setValueAtTime(830, ctx.currentTime);
    osc.frequency.setValueAtTime(1050, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio not supported or blocked
  }
};

const NOTIF_ICONS = {
  project_created: FolderPlus,
  task_created: ListChecks,
  message_sent: MessageSquare,
  file_shared: FileIcon,
};

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'À l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  return `Il y a ${Math.floor(hours / 24)}j`;
}

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    // Load existing notifications filtered by this user
    notifApi.get(`/notifications?unread=true&userId=${user.id}`).then((res) => {
      setNotifications(res.data);
    }).catch(() => {});

    // Connect to notification socket
    const token = localStorage.getItem('token');
    if (!token) return;
    socketRef.current = io(NOTIF_SOCKET_URL, { auth: { token } });

    socketRef.current.on('notification', (notif) => {
      // Only add if it's for this user
      if (!notif.userId || notif.userId === String(user.id)) {
        setNotifications((prev) => [notif, ...prev]);
        playNotificationSound();
        toast.info(
          <div>
            <strong>{notif.title}</strong>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{notif.message}</p>
          </div>,
          { icon: '🔔', autoClose: 5000 }
        );
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await notifApi.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notifApi.put(`/notifications/read-all?userId=${user?.id}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

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
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </button>
          {showNotif && (
            <div className="notif-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="notif-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>
                    Tout marquer lu
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="notif-empty">
                  <p >Aucune notification</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((notif) => {
                  const Icon = NOTIF_ICONS[notif.type] || Bell;
                  return (
                    <div
                      key={notif._id}
                      className={`notif-item ${!notif.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notif._id)}
                    >
                      {!notif.read && <div className="notif-dot"></div>}
                      <div className="notif-icon-wrapper">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="notif-title">{notif.title}</p>
                        <p className="notif-message">{notif.message}</p>
                        <span>{timeAgo(notif.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
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
