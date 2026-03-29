import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import ProjectForm from '../components/ProjectForm';
import ConfirmModal from '../components/ConfirmModal';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Eye,
  X,
  Calendar,
} from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [filters, setFilters] = useState({
    name: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, catRes] = await Promise.all([
        API.get('/projects'),
        API.get('/categories'),
      ]);
      setProjects(projRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error('Error loading projects:', err);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteProject = async () => {
    try {
      const res = await API.delete(`/projects/${confirmDelete}`);
      toast.success(res.data?.message || 'Projet supprimé avec succès');
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression du projet';
      toast.error(msg);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleEdit = (project) => {
    setEditProject(project);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditProject(null);
    loadData();
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c._id === id);
    return cat ? cat.name : '—';
  };

  const handleSearch = async () => {
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await API.get('/projects/search', { params });
      setProjects(res.data);
      console.log('Search results:', res.data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleReset = () => {
    setFilters({ name: '', status: '', startDate: '', endDate: '' });
    loadData();
  };

  const statusConfig = {
    'en-cours': { label: 'En cours', className: 'status-en-cours' },
    'termine': { label: 'Terminé', className: 'status-termine' },
    'en-attente': { label: 'En attente', className: 'status-en-attente' },
    'annule': { label: 'Annulé', className: 'status-annule' },
  };

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1>Projets</h1>
          <p>{projects.length} projet(s) au total</p>
        </div>
        <button
          className="btn btn-primary btn-icon"
          onClick={() => {
            setEditProject(null);
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Nouveau projet
        </button>
      </div>

      {/* Filters */}
      <div className="card filter-card">
        <div className="filter-header">
          <Filter size={18} />
          <h3>Filtres</h3>
        </div>
        <div className="filter-row">
          <div className="filter-field">
            <Search size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tous les statuts</option>
            <option value="en-cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="en-attente">En attente</option>
            <option value="annule">Annulé</option>
          </select>
          <div className="filter-field">
            <Calendar size={16} />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters({ ...filters, startDate: e.target.value })
              }
            />
          </div>
          <div className="filter-field">
            <Calendar size={16} />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters({ ...filters, endDate: e.target.value })
              }
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSearch}>
            Filtrer
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editProject ? '✏️ Modifier le projet' : '➕ Nouveau projet'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <ProjectForm
              current={editProject}
              onSaved={handleSaved}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProject && (
        <div className="modal-overlay" onClick={() => setViewProject(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Détails du projet</h2>
              <button className="modal-close" onClick={() => setViewProject(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="project-detail">
              <h3>{viewProject.name}</h3>
              <h4 className="project-owner">Propriétaire: {viewProject.ownerName || 'N/A'}</h4>
              <p className="project-desc">
                {viewProject.description || 'Pas de description'}
              </p>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Catégorie</span>
                  <span>{getCategoryName(viewProject.idCategory)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Statut</span>
                  <span
                    className={`status-badge ${statusConfig[viewProject.status]?.className || ''}`}
                  >
                    {statusConfig[viewProject.status]?.label || viewProject.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date début</span>
                  <span>
                    {viewProject.startDate
                      ? new Date(viewProject.startDate).toLocaleDateString('fr-FR')
                      : '—'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Date fin</span>
                  <span>
                    {viewProject.endDate
                      ? new Date(viewProject.endDate).toLocaleDateString('fr-FR')
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Chargement des projets...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📂</div>
          <h3>Aucun projet trouvé</h3>
          <p>Commencez par créer votre premier projet</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Créer un projet
          </button>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <div key={p._id} className="project-card">
              <div className="project-card-header">
                <span
                  className={`status-badge ${statusConfig[p.status]?.className || ''}`}
                >
                  {statusConfig[p.status]?.label || p.status || 'N/A'}
                </span>
                <div className="project-card-actions">
                  <button
                    className="icon-btn"
                    onClick={() => setViewProject(p)}
                    title="Voir"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => handleEdit(p)}
                    title="Modifier"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="icon-btn icon-btn-danger"
                    onClick={() => handleDelete(p._id)}
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="project-card-title">{p.name}</h3>
              <p className="project-card-desc">
                {p.description?.substring(0, 100) || 'Pas de description'}
              </p>
              <div className="project-card-meta">
                <span className="meta-item">
                  📁 {getCategoryName(p.idCategory)}
                </span>
                <span className="meta-item">
                  📅{' '}
                  {p.startDate
                    ? new Date(p.startDate).toLocaleDateString('fr-FR')
                    : '—'}
                </span>
              </div>
              {/* {p.members && p.members.length > 0 && (
                <div className="project-card-members">
                  {p.members.slice(0, 3).map((m, i) => (
                    <div key={i} className="member-avatar-sm">
                      {typeof m === 'string' ? m.charAt(0) : '?'}
                    </div>
                  ))}
                  {p.members.length > 3 && (
                    <span className="member-more">+{p.members.length - 3}</span>
                  )}
                </div>
              )} */}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Supprimer le projet"
        message="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
        onConfirm={confirmDeleteProject}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
