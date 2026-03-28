import { useState, useEffect } from "react";
import Loader from "../components/Loader";
import API from "../api/axios";
import { toast } from 'react-toastify';
import API_AUTH from "../api/axiosauth";
import taskAPI from "../api/taskApi";
import MultiUserSelect from "../components/MultiUserSelect";
import {
  Plus,
  X,
  GripVertical,
  MessageSquare,
  Clock,
  User,
  Edit3,
  Trash2,
  Paperclip,
  Download,
  AlertTriangle,
  FileText,
} from "lucide-react";
import ConfirmModal from '../components/ConfirmModal';

const COLUMNS = [
  { id: "todo", title: "À faire", color: "#e2e8f0", accent: "#6C63FF" },
  { id: "in-progress", title: "En cours", color: "#fef3c7", accent: "#F59E0B" },
  { id: "done", title: "Terminé", color: "#d1fae5", accent: "#10B981" },
];

export default function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [draggedTask, setDraggedTask] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deadlineTasks, setDeadlineTasks] = useState([]);
  const [showDeadlineAlert, setShowDeadlineAlert] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
    assignedTo: [],
    projectId: "",
    status: "todo",
  });

  useEffect(() => {
    loadProjects();
    loadUsers();
    checkDeadlines();
  }, []);

  useEffect(() => {
    loadTasks();
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const res = await API.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await API_AUTH.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const checkDeadlines = async () => {
    try {
      const res = await taskAPI.get("/tasks/deadlines");
      if (res.data.length > 0) {
        setDeadlineTasks(res.data);
        setShowDeadlineAlert(true);
        toast.warning(`${res.data.length} tâche(s) arrivent à échéance dans les prochaines 24h !`);
      }
    } catch (err) {
      console.error("Error checking deadlines:", err);
    }
  };

  const handleFileUpload = async (taskId, file) => {
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await taskAPI.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
      if (editTask && editTask._id === taskId) setEditTask(res.data);
      toast.success("Fichier ajouté");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors de l'upload");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (taskId, attachmentId) => {
    try {
      const res = await taskAPI.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
      if (editTask && editTask._id === taskId) setEditTask(res.data);
      toast.success("Fichier supprimé");
    } catch (err) {
      toast.error("Erreur lors de la suppression du fichier");
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => (u._id ?? u.id) == userId);
    return user?.name || "?";
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const url = selectedProject
        ? `/tasks?projectId=${selectedProject}`
        : "/tasks";
      const res = await taskAPI.get(url);
      setTasks(res.data);
    } catch (err) {
      console.error("Error loading tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      // Build responsible names from selected user IDs
      payload.responsible = (payload.assignedTo || []).map(id => getUserName(id));
      if (!payload.assignedTo || payload.assignedTo.length === 0) delete payload.assignedTo;
      if (!payload.projectId) delete payload.projectId;

      if (editTask) {
        await taskAPI.put(`/tasks/${editTask._id}`, payload);
      } else {
        await taskAPI.post("/tasks", payload);
      }
      setShowForm(false);
      setEditTask(null);
      setForm({
        title: "",
        description: "",
        priority: "medium",
        deadline: "",
        assignedTo: [],
        projectId: selectedProject,
        status: "todo",
      });
      loadTasks();
      toast.success(editTask ? 'Tâche modifiée' : 'Tâche créée avec succès');
    } catch (err) {
      console.error("Error saving task:", err);
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde de la tâche');
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteTask = async () => {
    try {
      await taskAPI.delete(`/tasks/${confirmDelete}`);
      toast.success('Tâche supprimée');
      loadTasks();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression de la tâche';
      toast.error(msg);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.put(`/tasks/${taskId}`, { status: newStatus });
      loadTasks();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleAddComment = async (taskId) => {
    if (!commentText) return;

    try {
      await taskAPI.post(`/comments/`, { text: commentText, taskId });
      setCommentText("");
      handleGetComments(taskId);
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleGetComments = async (taskId) => {
    setShowComments(true);
    setTaskId(taskId);
    try {
      const res = await taskAPI.get(`/comments/${taskId}`);
      console.log("Loaded comments:", res.data);
      setComments(res.data);
    } catch (err) {
      console.error("Error loading comments:", err);
    }
  };

  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.setData("text/plain", task._id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
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
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      deadline: task.deadline?.slice(0, 10) || "",
      assignedTo: Array.isArray(task.assignedTo) ? task.assignedTo : (task.assignedTo ? [task.assignedTo] : []),
      projectId: task.projectId?._id || task.projectId || "",
      status: task.status || "todo",
    });
    setShowForm(true);
  };

  const openNewForm = (status = "todo") => {
    setEditTask(null);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      deadline: "",
      assignedTo: [],
      projectId: selectedProject,
      status,
    });
    setShowForm(true);
  };

  const priorityConfig = {
    high: { label: "Haute", className: "priority-high" },
    medium: { label: "Moyenne", className: "priority-medium" },
    low: { label: "Basse", className: "priority-low" },
  };

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  if (loading) {
    return <Loader text="Chargement des tâches..." />;
  }

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

      {/* Deadline Alert Banner */}
      {showDeadlineAlert && deadlineTasks.length > 0 && (
        <div className="deadline-alert-banner">
          <div className="deadline-alert-content">
            <AlertTriangle size={18} />
            <div>
              <strong>Rappel de deadlines !</strong>
              <span> {deadlineTasks.length} tâche(s) arrivent à échéance dans les prochaines 24h :</span>
              <ul className="deadline-task-list">
                {deadlineTasks.map(t => (
                  <li key={t._id}>
                    <strong>{t.title}</strong> — {new Date(t.deadline).toLocaleDateString("fr-FR")}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button className="deadline-alert-close" onClick={() => setShowDeadlineAlert(false)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTask ? "✏️ Modifier la tâche" : "➕ Nouvelle tâche"}</h2>
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
                  <MultiUserSelect
                    users={users}
                    value={form.assignedTo}
                    onChange={(val) => setForm({ ...form, assignedTo: val })}
                  />
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

              {/* File Attachments (only in edit mode) */}
              {editTask && (
                <div className="form-group">
                  <label><Paperclip size={14} /> Fichiers joints</label>
                  <div className="attachments-list">
                    {(editTask.attachments || []).map((att) => (
                      <div key={att._id} className="attachment-item">
                        <FileText size={14} />
                        <a
                          href={`http://localhost:5003${att.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="attachment-name"
                        >
                          {att.fileName}
                        </a>
                        <button
                          type="button"
                          className="icon-btn-sm icon-btn-danger"
                          onClick={() => handleDeleteAttachment(editTask._id, att._id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="file-upload-btn">
                    <Paperclip size={14} />
                    {uploadingFile ? "Upload en cours..." : "Ajouter un fichier"}
                    <input
                      type="file"
                      hidden
                      disabled={uploadingFile}
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileUpload(editTask._id, e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editTask ? "Modifier" : "Créer"}
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
        <div
          className="modal-overlay"
          onClick={() => {
            setShowComments(null);
            setTaskId(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💬 Commentaires</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowComments(null);
                  setTaskId(null);
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="comments-section">
              <div className="comments-list">
                {!comments || comments.length === 0 ? (
                  <p className="no-comments">Aucun commentaire</p>
                ) : (
                  comments.map((c, i) => (
                    <div key={i} className="comment-item">
                      <div className="comment-avatar">
                        {c.user?.username?.charAt(0) || "U"}
                      </div>
                      <div className="comment-body">
                        <div className="comment-meta">
                          <span className="comment-author">
                            {c.user?.username || "Utilisateur"}
                          </span>
                          <span className="comment-date">
                            {new Date(c.createdAt).toLocaleDateString("fr-FR")}
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
                    if (e.key === "Enter") handleAddComment(taskId);
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddComment(taskId)}
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
            className={`kanban-column ${dragOverColumn === col.id ? "kanban-column-dragover" : ""}`}
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
              <button className="icon-btn" onClick={() => openNewForm(col.id)}>
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
                      className={`priority-badge ${priorityConfig[task.priority]?.className || ""}`}
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
                  {task.creatorName && <p className="kanban-card-creator">Créé par: {task.creatorName}</p>}

                  {task.responsible && task.responsible.length > 0 && (
                    <div className="kanban-card-assignees">
                      <User size={12} />
                      <span>{Array.isArray(task.responsible) ? task.responsible.join(", ") : task.responsible}</span>
                    </div>
                  )}

                  {task.description && (
                    <p className="kanban-card-desc">
                      {task.description.substring(0, 80)}
                    </p>
                  )}
                  <div className="kanban-card-footer">
                    <div className="kanban-card-meta">
                      {task.deadline && (
                        <span className={`meta-tag ${new Date(task.deadline) < new Date(Date.now() + 24*60*60*1000) && task.status !== "done" ? "meta-tag-urgent" : ""}`}>
                          <Clock size={12} />
                          {new Date(task.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {task.attachments && task.attachments.length > 0 && (
                        <span className="meta-tag">
                          <Paperclip size={12} />
                          {task.attachments.length}
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
                        onClick={() => handleGetComments(task._id)}
                      >
                        <MessageSquare size={14} />
                      </button>
                      {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="assigned-avatars">
                          {(Array.isArray(task.assignedTo) ? task.assignedTo : [task.assignedTo]).slice(0, 3).map((userId, i) => (
                            <div
                              key={i}
                              className="assigned-avatar"
                              title={getUserName(userId)}
                              style={{ zIndex: 3 - i }}
                            >
                              {getUserName(userId).charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {Array.isArray(task.assignedTo) && task.assignedTo.length > 3 && (
                            <div className="assigned-avatar assigned-avatar-more">
                              +{task.assignedTo.length - 3}
                            </div>
                          )}
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

      <ConfirmModal
        open={!!confirmDelete}
        title="Supprimer la tâche"
        message="Êtes-vous sûr de vouloir supprimer cette tâche ? Cette action est irréversible."
        onConfirm={confirmDeleteTask}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
