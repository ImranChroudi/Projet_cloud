import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Search,
  UserPlus,
  Edit3,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Lock,
  Unlock,
  X,
} from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        const data = { username: form.username, email: form.email, role: form.role };
        if (form.password) data.password = form.password;
        await API.put(`/users/${editUser._id}`, data);
      } else {
        await API.post('/users', form);
      }
      setShowForm(false);
      setEditUser(null);
      setForm({ username: '', email: '', password: '', role: 'user' });
      loadUsers();
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      await API.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'banned' : 'active';
    try {
      await API.put(`/users/${user._id}`, { status: newStatus });
      loadUsers();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setShowForm(true);
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleConfig = {
    admin: { label: 'Admin', className: 'role-admin' },
    manager: { label: 'Manager', className: 'role-manager' },
    user: { label: 'Utilisateur', className: 'role-user' },
  };

  const statusConfig = {
    active: { label: 'Actif', className: 'user-status-active' },
    inactive: { label: 'Inactif', className: 'user-status-inactive' },
    banned: { label: 'Bloqué', className: 'user-status-banned' },
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Gestion des utilisateurs</h1>
          <p>{users.length} utilisateur(s)</p>
        </div>
        <button
          className="btn btn-primary btn-icon"
          onClick={() => {
            setEditUser(null);
            setForm({ username: '', email: '', password: '', role: 'user' });
            setShowForm(true);
          }}
        >
          <UserPlus size={18} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Search & filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="filter-row">
          <div className="filter-field" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">Utilisateur</option>
          </select>
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editUser ? '✏️ Modifier l\'utilisateur' : '👤 Nouvel utilisateur'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>Nom d&apos;utilisateur</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                  placeholder="Nom d'utilisateur"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="Email"
                />
              </div>
              <div className="form-group">
                <label>
                  Mot de passe {editUser && '(laisser vide pour ne pas changer)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Mot de passe"
                  {...(!editUser && { required: true })}
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="user">Utilisateur</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editUser ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Inscrit le</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-table-avatar">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="user-table-name">{u.username}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`role-badge ${roleConfig[u.role]?.className || ''}`}
                      >
                        {roleConfig[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`user-status ${statusConfig[u.status]?.className || ''}`}
                      >
                        {statusConfig[u.status]?.label || u.status}
                      </span>
                    </td>
                    <td>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString('fr-FR')
                        : '—'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(u)}
                          title="Modifier"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => handleToggleStatus(u)}
                          title={
                            u.status === 'active' ? 'Bloquer' : 'Débloquer'
                          }
                        >
                          {u.status === 'active' ? (
                            <Lock size={16} />
                          ) : (
                            <Unlock size={16} />
                          )}
                        </button>
                        <button
                          className="icon-btn icon-btn-danger"
                          onClick={() => handleDelete(u._id)}
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-table">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
