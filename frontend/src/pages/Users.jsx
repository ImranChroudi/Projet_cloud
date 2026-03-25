import { useState, useEffect } from 'react';
import API from '../api/axiosauth';
import {
  Search,
  UserPlus,
  Edit3,
  Trash2,
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

  const normalizeUser = (u) => ({
    ...u,
    _id: u.id,
    username: u.name,
    status: u.is_blocked ? 'banned' : 'active',
  });

const loadUsers = async () => {
  setLoading(true);
  try {
    const res = await API.get('/users');

    console.log("DATA:", res.data);

    if (Array.isArray(res.data)) {
      setUsers(res.data.map(normalizeUser));
    }

    else if (Array.isArray(res.data.users)) {
      setUsers(res.data.users.map(normalizeUser));
    }

    else {
      console.error("Data machi array:", res.data);
      setUsers([]);
    }

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
  // ADD / UPDATE
 
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editUser) {
        const data = {
          name: form.username,
          email: form.email,
          role: form.role,
        };

        if (form.password) data.password = form.password;

        await API.put(`/users/${editUser._id}`, data);
      } else {
        await API.post('/users', {
          name: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      }

      resetForm();
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;

    try {
      await API.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // BLOCK / UNBLOCK
  const handleToggleStatus = async (user) => {
    try {
      if (user.status === 'active') {
        await API.put(`/users/block/${user._id}`);
      } else {
        await API.put(`/users/unblock/${user._id}`);
      }
      loadUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // EDIT
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

  const resetForm = () => {
    setShowForm(false);
    setEditUser(null);
    setForm({
      username: '',
      email: '',
      password: '',
      role: 'user',
    });
  };

  // FILTER
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

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
            resetForm();
            setShowForm(true);
          }}
        >
          <UserPlus size={18} />
          Nouvel utilisateur
        </button>
      </div>

      {/* FILTER */}
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

      {/* MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {editUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </h2>
              <button className="modal-close" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
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
                  {...(!editUser && { required: true })}
                />
              </div>

              <div className="form-group">
                <label>Rôle</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
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
                  onClick={resetForm}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <div className="loading-state">
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
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>

                    <td>
                      <span
                        className={`role-badge ${roleConfig[u.role]?.className}`}
                      >
                        {roleConfig[u.role]?.label}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`user-status ${statusConfig[u.status]?.className}`}
                      >
                        {statusConfig[u.status]?.label}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                      <button className="icon-btn icon-edit" onClick={() => openEdit(u)}>
  <Edit3 size={16} />
</button>

<button
  className={`icon-btn ${u.status === 'active' ? 'icon-lock' : 'icon-unlock'}`}
  onClick={() => handleToggleStatus(u)}
>
  {u.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
</button>

<button className="icon-btn icon-delete" onClick={() => handleDelete(u._id)}>
  <Trash2 size={16} />
</button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="5">Aucun utilisateur</td>
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