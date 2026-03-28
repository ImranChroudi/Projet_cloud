import { useState, useEffect } from 'react';
import API from '../api/axios';
import ConfirmModal from './ConfirmModal';

export default function ProjectList({ onEdit, refresh }) {
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    nom: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchCategories();
  }, [refresh]);

  const fetchProjects = async () => {
    try {
      const params = {};
      if (filters.name) params.name = filters.name;
      if (filters.status) params.status = filters.status;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const res = await API.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Erreur chargement projets:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c._id === id);
    return cat ? cat.name : '—';
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteProject = async () => {
    try {
      await API.delete(`/projects/${confirmDelete}`);
      fetchProjects();
    } catch (err) {
      console.error('Erreur suppression:', err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleReset = () => {
    setFilters({ nom: '', status: '', startDate: '', endDate: '' });
    setTimeout(fetchProjects, 0);
  };

  const statusLabel = (s) => {
    const map = {
      'en-cours': 'En cours',
      'termine': 'Terminé',
      'en-attente': 'En attente',
      'annule': 'Annulé',
    };
    return map[s] || s;
  };

  const statusClass = (s) => `status-badge status-${s}`;

  return (
    <div className="project-list">
      <form className="filters" onSubmit={handleFilterSubmit}>
        <h3>Filtrer les projets</h3>
        <div className="filter-row">
          <input
            type="text"
            name="nom"
            placeholder="Rechercher par nom..."
            value={filters.name}
            onChange={handleFilterChange}
          />
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Tous les statuss</option>
            <option value="en-cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="en-attente">En attente</option>
            <option value="annule">Annulé</option>
          </select>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
          <button type="submit" className="btn btn-primary">Filtrer</button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Réinitialiser
          </button>
        </div>
      </form>

      {projects.length === 0 ? (
        <p className="empty-msg">Aucun projet trouvé.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id}>
                  <td className="td-name">{p.name}</td>
                  <td className="td-desc">{p.description}</td>
                  <td>{getCategoryName(p.categorie)}</td>
                  <td>{p.startDate?.slice(0, 10)}</td>
                  <td>{p.endDate?.slice(0, 10)}</td>
                  <td>
                    <span className={statusClass(p.status)}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn btn-edit" onClick={() => onEdit(p)}>
                      ✏️ Modifier
                    </button>
                    <button className="btn btn-delete" onClick={() => handleDelete(p._id)}>
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
