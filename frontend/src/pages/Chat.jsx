import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import messageApi from '../api/messageApi';
import { io } from 'socket.io-client';
import { Send, Hash, Users, Paperclip, X, FileText, Image } from 'lucide-react';
import { toast } from 'react-toastify';

const SOCKET_URL = 'http://localhost:3003';

export default function Chat() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  // Connect socket on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      // If the message is for a different channel than selected, increment unread
      setUnreadCounts((prev) => {
        const isCurrentChannel = selectedChannel?._id === message.projectId;
        const isOwnMessage = message.user === String(user?.id);
        if (!isCurrentChannel && !isOwnMessage) {
          return { ...prev, [message.projectId]: (prev[message.projectId] || 0) + 1 };
        }
        return prev;
      });
    });

    loadProjects();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Update the newMessage handler to track selectedChannel ref
  const selectedChannelRef = useRef(null);
  useEffect(() => {
    selectedChannelRef.current = selectedChannel;
  }, [selectedChannel]);

  // Join/leave project room when channel changes
  useEffect(() => {
    if (selectedChannel) {
      socketRef.current?.emit('joinProject', selectedChannel._id);
      loadMessages(selectedChannel._id);
      // Clear unread for this channel
      setUnreadCounts((prev) => {
        const next = { ...prev };
        delete next[selectedChannel._id];
        return next;
      });
      // Mark as read on server
      messageApi.put(`/mark-read/${selectedChannel._id}`, { userId: String(user?.id) }).catch(() => {});

      return () => {
        socketRef.current?.emit('leaveProject', selectedChannel._id);
      };
    }
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load unread counts periodically
  useEffect(() => {
    if (projects.length === 0 || !user?.id) return;
    const loadUnread = async () => {
      try {
        const ids = projects.map((p) => p._id).join(',');
        const res = await messageApi.get(`/unread-counts?userId=${user.id}&projectIds=${ids}`);
        setUnreadCounts(res.data);
      } catch {}
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, [projects, user?.id]);

  const loadProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedChannel(res.data[0]);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadMessages = async (projectId) => {
    try {
      const res = await messageApi.get(`/messages/${projectId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Messages not available:', err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.warn('Le fichier ne doit pas dépasser 10 Mo');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedChannel) return;

    let fileData = {};

    // Upload file first if selected
    if (selectedFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await messageApi.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileData = uploadRes.data;
      } catch (err) {
        console.error('Upload error:', err);
        toast.error("Erreur lors de l'envoi du fichier");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    socketRef.current?.emit('sendMessage', {
      projectId: selectedChannel._id,
      text: newMessage,
      fileUrl: fileData.fileUrl || null,
      fileName: fileData.fileName || null,
      fileType: fileData.fileType || null,
    });
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
    });
  };

  const isImage = (type) => type && type.startsWith('image/');

  const renderFileAttachment = (msg) => {
    if (!msg.fileUrl) return null;
    const fullUrl = `http://localhost:3003${msg.fileUrl}`;

    if (isImage(msg.fileType)) {
      return (
        <div className="chat-file-attachment">
          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
            <img src={fullUrl} alt={msg.fileName} className="chat-file-image" />
          </a>
          <span className="chat-file-name">{msg.fileName}</span>
        </div>
      );
    }

    return (
      <div className="chat-file-attachment chat-file-doc">
        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="chat-file-link">
          <FileText size={20} />
          <span className="chat-file-name">{msg.fileName}</span>
        </a>
      </div>
    );
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>
            <Hash size={18} /> Canaux
          </h3>
        </div>
        <div className="chat-channels">
          {projects.map((p) => (
            <button
              key={p._id}
              className={`chat-channel ${selectedChannel?._id === p._id ? 'active' : ''}`}
              onClick={() => setSelectedChannel(p)}
            >
              <Hash size={16} />
              <span>{p.name}</span>
              {unreadCounts[p._id] > 0 && (
                <span className="chat-unread-badge">{unreadCounts[p._id]}</span>
              )}
            </button>
          ))}
          {projects.length === 0 && (
            <div className="chat-empty-channels">
              <p>Aucun projet disponible</p>
            </div>
          )}
        </div>
        <div className="chat-sidebar-footer">
          <div className="chat-user-info">
            <div className="chat-user-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="chat-user-name">{user?.username}</span>
              <span className="chat-user-status">En ligne</span>
            </div>
          </div>
        </div>
      </div>

      <div className="chat-main">
        {selectedChannel ? (
          <>
            <div className="chat-main-header">
              <div>
                <h3>
                  <Hash size={18} /> {selectedChannel.name}
                </h3>
                <p>{selectedChannel.description || 'Discussion du projet'}</p>
              </div>
              <div className="chat-header-actions">
                <button className="icon-btn">
                  <Users size={18} />
                </button>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon">💬</div>
                  <h3>Bienvenue dans #{selectedChannel.name}</h3>
                  <p>
                    C&apos;est le début de la discussion pour ce projet.
                    Envoyez un message pour commencer !
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const showDate =
                    i === 0 ||
                    formatDate(msg.createdAt) !==
                      formatDate(messages[i - 1].createdAt);
                  return (
                    <div key={msg._id || i}>
                      {showDate && (
                        <div className="chat-date-separator">
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                      )}
                      <div
                        className={`chat-message ${msg.username === user?.username ? 'own' : ''}`}
                      >
                        <div className="chat-msg-avatar">
                          {(msg.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="chat-msg-content">
                          <div className="chat-msg-header">
                            <span className="chat-msg-author">
                              {msg?.username || 'Utilisateur'}
                            </span>
                            <span className="chat-msg-time">
                              {formatTime(msg.createdAt)}
                            </span>
                          </div>
                          {msg.text && <p className="chat-msg-text">{msg.text}</p>}
                          {renderFileAttachment(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage}>
              {selectedFile && (
                <div className="chat-file-preview">
                  {selectedFile.type.startsWith('image/') ? (
                    <Image size={16} />
                  ) : (
                    <FileText size={16} />
                  )}
                  <span>{selectedFile.name}</span>
                  <button type="button" className="chat-file-remove" onClick={removeFile}>
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="chat-input-wrapper">
                <button
                  type="button"
                  className="chat-attach-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Joindre un fichier"
                >
                  <Paperclip size={18} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message #${selectedChannel.name}...`}
                />
                <div className="chat-input-actions">
                  <button
                    type="submit"
                    className="chat-send-btn"
                    disabled={(!newMessage.trim() && !selectedFile) || uploading}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="chat-no-channel">
            <div className="chat-welcome-icon">💬</div>
            <h3>Sélectionnez un canal</h3>
            <p>Choisissez un projet pour commencer à discuter</p>
          </div>
        )}
      </div>
    </div>
  );
}
