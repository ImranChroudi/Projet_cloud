import { useState, useEffect } from 'react';
import API from '../api/axios';
import ConfirmModal from './ConfirmModal';

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [nom, setNom] = useState('');
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return;
    try {
      if (editId) {
        await API.put(`/categories/${editId}`, { nom });
        setEditId(null);
      } else {
        await API.post('/categories', { nom });
      }
      setNom('');
      fetchCategories();
    } catch (err) {
      console.error('Erreur sauvegarde catégorie:', err);
    }
  };

  const handleEdit = (cat) => {
    setEditId(cat._id);
    setNom(cat.name);
  };

  const handleDelete = async (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteCategory = async () => {
    try {
      await API.delete(`/categories/${confirmDelete}`);
      fetchCategories();
    } catch (err) {
      console.error('Erreur suppression catégorie:', err);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setNom('');
  };

  return (
    <div className="category-manager">
      <h3>📁 Gérer les catégories</h3>
      <form onSubmit={handleSubmit} className="category-form">
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom de la catégorie"
          required
        />
        <button type="submit" className="btn btn-primary">
          {editId ? 'Modifier' : 'Ajouter'}
        </button>
        {editId && (
          <button type="button" className="btn btn-secondary" onClick={handleCancel}>
            Annuler
          </button>
        )}
      </form>
      <ul className="category-list">
        {categories.map((c) => (
          <li key={c._id}>
            <span>{c.name}</span>
            <div>
              <button className="btn btn-edit btn-sm" onClick={() => handleEdit(c)}>
                ✏️
              </button>
              <button className="btn btn-delete btn-sm" onClick={() => handleDelete(c._id)}>
                🗑️
              </button>
            </div>
          </li>
        ))}
        {categories.length === 0 && <li className="empty-msg">Aucune catégorie</li>}
      </ul>

      <ConfirmModal
        open={!!confirmDelete}
        title="Supprimer la catégorie"
        message="Êtes-vous sûr de vouloir supprimer cette catégorie ?"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
