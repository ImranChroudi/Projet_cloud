import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';

export default function ProjectForm({ current, onSaved, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    idCategory: '',
    startDate: '',
    endDate: '',
    status: 'en-attente',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (current) {
      setForm({
        name: current.name || '',
        description: current.description || '',
        idCategory: current.idCategory || '',
        startDate: current.startDate?.slice(0, 10) || '',
        endDate: current.endDate?.slice(0, 10) || '',
        status: current.status || 'en-attente',
      });
    } else {
      setForm({
        name: '',
        description: '',
        idCategory: '',
        startDate: '',
        endDate: '',
        status: 'en-attente',
      });
    }
  }, [current]);

  const fetchCategories = async () => {
    try {
      const res = await API.get('/categories');

      setCategories(res.data);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (current) {
        const res =await API.put(`/projects/${current._id}`, form);
        if(!res.data.success){
          toast.error(res.data.message || "Erreur lors de la mise à jour du projet");
          return;
        }

      } else {
        await API.post('/projects', form);
      }
      onSaved();
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <div className="form-group">
        <label>Nom du projet</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder="Nom du projet"
        />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description du projet"
          rows={3}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Catégorie</label>
          <select name="idCategory" value={form.idCategory} onChange={handleChange}>
            <option value="">— Aucune —</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Statut</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="en-attente">En attente</option>
            <option value="en-cours">En cours</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Date de début</label>
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Date de fin</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {current ? 'Modifier' : 'Créer le projet'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
