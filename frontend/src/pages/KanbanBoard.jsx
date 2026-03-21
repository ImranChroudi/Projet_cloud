import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
  Plus,
  X,
  GripVertical,
  MessageSquare,
  Clock,
  User,
  Edit3,
  Trash2,
} from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'À faire', color: '#e2e8f0', accent: '#6C63FF' },
  { id: 'in-progress', title: 'En cours', color: '#fef3c7', accent: '#F59E0B' },
  { id: 'done', title: 'Terminé', color: '#d1fae5', accent: '#10B981' },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: '',
    assignedTo: '',
    projectId: '',
    status: 'todo',
  });

  useEffect(() => {
    loadProjects();
    loadUsers();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadTasks = async () => {
    try {
      const url = selectedProject
        ? `/tasks?projectId=${selectedProject}`
        : '/tasks';
      const res = await API.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error('Error loading tasks:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      // Remove empty strings for ObjectId fields — Mongoose can't cast '' to ObjectId
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.projectId) delete payload.projectId;

      if (editTask) {
        await API.put(`/tasks/${editTask._id}`, payload);
      } else {
        await API.post('/tasks', payload);
      }
      setShowForm(false);
      setEditTask(null);
      setForm({
        title: '',
        description: '',
        priority: 'medium',
        deadline: '',
        assignedTo: '',
        projectId: selectedProject,
        status: 'todo',
      });
      loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    try {
      await API.delete(`/tasks/${id}`);
      loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.put(`/tasks/${taskId}`, { status: newStatus });
      loadTasks();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleAddComment = async (taskId) => {
    if (!commentText.trim()) return;
    try {
      await API.post(`/tasks/${taskId}/comments`, { text: commentText });
      setCommentText('');
      loadTasks();
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task._id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) setDragOverColumn(columnId);
  };

  const handleDragLeave = (e) => {
    // Only reset if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedTask && draggedTask.status !== columnId) {
      handleStatusChange(draggedTask._id, columnId);
    }
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const openEditForm = (task) => {
    setEditTask(task);
    setForm({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      deadline: task.deadline?.slice(0, 10) || '',
      assignedTo: task.assignedTo?._id || task.assignedTo || '',
      projectId: task.projectId?._id || task.projectId || '',
      status: task.status || 'todo',
    });
    setShowForm(true);
  };

  const openNewForm = (status = 'todo') => {
    setEditTask(null);
    setForm({
      title: '',
      description: '',
      priority: 'medium',
      deadline: '',
      assignedTo: '',
      projectId: selectedProject,
      status,
    });
    setShowForm(true);
  };

  const priorityConfig = {
    high: { label: 'Haute', className: 'priority-high' },
    medium: { label: 'Moyenne', className: 'priority-medium' },
    low: { label: 'Basse', className: 'priority-low' },
  };

  const getTasksByStatus = (status) =>
    tasks.filter((t) => t.status === status);

  return (
    <div className="kanban-page">
      <div className="page-header">
        <div>
          <h1>Tableau Kanban</h1>
          <p>Gérez vos tâches par glisser-déposer</p>
        </div>
        <div className="page-header-actions">
          <select
            className="project-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Tous les projets</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-icon"
            onClick={() => openNewForm()}
          >
            <Plus size={18} />
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTask ? '✏️ Modifier la tâche' : '➕ Nouvelle tâche'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="task-form">
              <div className="form-group">
                <label>Titre</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Titre de la tâche"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Description..."
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Priorité</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="todo">À faire</option>
                    <option value="in-progress">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Assigner à</label>
                  <select
                    value={form.assignedTo}
                    onChange={(e) =>
                      setForm({ ...form, assignedTo: e.target.value })
                    }
                  >
                    <option value="">— Non assigné —</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Projet</label>
                <select
                  value={form.projectId}
                  onChange={(e) =>
                    setForm({ ...form, projectId: e.target.value })
                  }
                >
                  <option value="">— Aucun projet —</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editTask ? 'Modifier' : 'Créer'}
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

      {/* Comments Modal */}
      {showComments && (
        <div className="modal-overlay" onClick={() => setShowComments(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💬 Commentaires — {showComments.title}</h2>
              <button
                className="modal-close"
                onClick={() => setShowComments(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="comments-section">
              <div className="comments-list">
                {(!showComments.comments || showComments.comments.length === 0) ? (
                  <p className="no-comments">Aucun commentaire</p>
                ) : (
                  showComments.comments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <div className="comment-avatar">
                        {c.user?.username?.charAt(0) || 'U'}
                      </div>
                      <div className="comment-body">
                        <div className="comment-meta">
                          <span className="comment-author">
                            {c.user?.username || 'Utilisateur'}
                          </span>
                          <span className="comment-date">
                            {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <p>{c.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="comment-input">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Écrire un commentaire..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment(showComments._id);
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddComment(showComments._id)}
                >
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={`kanban-column ${dragOverColumn === col.id ? 'kanban-column-dragover' : ''}`}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div
              className="kanban-column-header"
              style={{ borderTopColor: col.accent }}
            >
              <div className="column-title">
                <span
                  className="column-dot"
                  style={{ background: col.accent }}
                ></span>
                <h3>{col.title}</h3>
                <span className="column-count">
                  {getTasksByStatus(col.id).length}
                </span>
              </div>
              <button
                className="icon-btn"
                onClick={() => openNewForm(col.id)}
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="kanban-cards">
              {getTasksByStatus(col.id).map((task) => (
                <div
                  key={task._id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="kanban-card-top">
                    <span
                      className={`priority-badge ${priorityConfig[task.priority]?.className || ''}`}
                    >
                      {priorityConfig[task.priority]?.label || task.priority}
                    </span>
                    <div className="kanban-card-actions">
                      <button
                        className="icon-btn-sm"
                        onClick={() => openEditForm(task)}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="icon-btn-sm icon-btn-danger"
                        onClick={() => handleDelete(task._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <h4 className="kanban-card-title">{task.title}</h4>
                  {task.description && (
                    <p className="kanban-card-desc">
                      {task.description.substring(0, 80)}
                    </p>
                  )}
                  <div className="kanban-card-footer">
                    <div className="kanban-card-meta">
                      {task.deadline && (
                        <span className="meta-tag">
                          <Clock size={12} />
                          {new Date(task.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                      {task.comments && task.comments.length > 0 && (
                        <span className="meta-tag">
                          <MessageSquare size={12} />
                          {task.comments.length}
                        </span>
                      )}
                    </div>
                    <div className="kanban-card-bottom-actions">
                      <button
                        className="text-btn"
                        onClick={() => setShowComments(task)}
                      >
                        <MessageSquare size={14} />
                      </button>
                      {task.assignedTo && (
                        <div className="assigned-avatar" title={task.assignedTo.username || ''}>
                          {(task.assignedTo.username || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
