import { useState, useEffect } from 'react';
import API from '../api/axios' ;
import { toast } from 'react-toastify';
import { Plus, Edit3, Trash2, Tag, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editCat) {
        await API.put(`/categories/${editCat._id}`, form);
      } else {
        await API.post('/categories', form);
      }
      setShowForm(false);
      setEditCat(null);
      setForm({ name: '', description: '' });
      toast.success(editCat ? 'Catégorie modifiée' : 'Catégorie créée avec succès');
      loadCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la sauvegarde de la catégorie');
    }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteCategory = async () => {
    try {
      await API.delete(`/categories/${confirmDelete}`);
      toast.success('Catégorie supprimée');
      loadCategories();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la suppression de la catégorie';
      toast.error(msg);
    } finally {
      setConfirmDelete(null);
    }
  };

  const openEdit = (cat) => {
    setEditCat(cat);
    setForm({ name: cat.name || '', description: cat.description || '' });
    setShowForm(true);
  };

  const colors = [
    '#6C63FF', '#FF6584', '#43E97B', '#F59E0B', '#3B82F6',
    '#EC4899', '#8B5CF6', '#14B8A6', '#F97316', '#06B6D4',
  ];

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1>Catégories</h1>
          <p>{categories.length} catégorie(s)</p>
        </div>
        <button
          className="btn btn-primary btn-icon"
          onClick={() => {
            setEditCat(null);
            setForm({ name: '', description: '' });
            setShowForm(true);
          }}
        >
          <Plus size={18} />
          Nouvelle catégorie
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editCat ? '✏️ Modifier' : '➕ Nouvelle catégorie'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nom de la catégorie"
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
                  placeholder="Description (optionnel)"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editCat ? 'Modifier' : 'Créer'}
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

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-icon">📁</div>
          <h3>Aucune catégorie</h3>
          <p>Créez des catégories pour organiser vos projets</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            <Plus size={18} />
            Créer une catégorie
          </button>
        </div>
      ) : (
        <div className="category-grid">
          {categories.map((cat, index) => (
            <div key={cat._id} className="category-card">
              <div
                className="category-card-accent"
                style={{ background: colors[index % colors.length] }}
              ></div>
              <div className="category-card-body">
                <div className="category-card-icon">
                  <Tag
                    size={24}
                    style={{ color: colors[index % colors.length] }}
                  />
                </div>
                <h3>{cat.name}</h3>
                <p>{cat.description || 'Pas de description'}</p>
              </div>
              <div className="category-card-footer">
                <button className="icon-btn" onClick={() => openEdit(cat)}>
                  <Edit3 size={16} />
                </button>
                <button
                  className="icon-btn icon-btn-danger"
                  onClick={() => handleDelete(cat._id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        title="Supprimer la catégorie"
        message="Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible."
        onConfirm={confirmDeleteCategory}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
