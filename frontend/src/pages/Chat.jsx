import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import messageApi from '../api/messageApi';
import { io } from 'socket.io-client';
import { Send, Hash, Users, Smile } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3003';

export default function Chat() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Connect socket on mount
  useEffect(() => {

  
    
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YjU5NDc1NzYyYmVjZjdmMjlkZjUzOSIsInJvbGUiOiJhZG1pbiIsImVtYWlsIjoiYWxpY2VAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzM1ODI2ODZ9.qrzLr2wqXBNLjJPDiSDzsf-WpRhknXVf70RF1KkhYEo";
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
    });



    socketRef.current.on("newMessage", (message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message[0]]);
      

    });

    loadProjects();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Join/leave project room when channel changes
  useEffect(() => {
    console.log("Selected channel changed:", selectedChannel?._id);
    if (selectedChannel) {
      socketRef.current?.emit("joinProject", selectedChannel._id);
      loadMessages(selectedChannel._id);

      return () => {
        socketRef.current?.emit("leaveProject", selectedChannel._id);
      };
    }
  }, [selectedChannel]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
      if (res.data.length > 0) {
        setSelectedChannel(res.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadMessages = async (projectId) => {
    try {
      const res = await messageApi.get(`/messages/${projectId}`);
      setMessages(res.data);
      console.log("Loaded messages:", res.data);
    } catch (err) {
      console.error('Messages not available:', err);
    }
  };

  const sendMessage = async (e) => {
    console.log("Sending message:", newMessage);
    e.preventDefault();
    if (!newMessage.trim() || !selectedChannel) return;
    socketRef.current?.emit("sendMessage", {
      projectId: selectedChannel._id,
      text: newMessage,
    });
    setNewMessage('');
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
                    <div key={msg._id}>
                      {showDate && (
                        <div className="chat-date-separator">
                          <span>{formatDate(msg.createdAt)}</span>
                        </div>
                      )}
                      <div
                        className={`chat-message ${msg.username === user?.username ? 'own' : ''}`}
                      >
                        <div className="chat-msg-avatar">
                          {(msg.user?.username || 'U').charAt(0).toUpperCase()}
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
                          <p className="chat-msg-text">{msg.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={sendMessage}>
              <div className="chat-input-wrapper">
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
                    disabled={!newMessage.trim()}
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
