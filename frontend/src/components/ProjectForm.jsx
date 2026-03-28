import { useState, useEffect } from "react";
import API from "../api/axios";
import { toast } from "react-toastify";
import API_AUTH from "../api/axiosauth";
import Select from "react-select";
import MultiUserSelect from "./MultiUserSelect";

export default function ProjectForm({ current, onSaved, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    idCategory: "",
    startDate: "",
    endDate: "",
    members: [],
    status: "en-attente",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    loadUsers();
  }, []);

  useEffect(() => {
    if (current) {
      setForm({
        name: current.name || "",
        description: current.description || "",
        idCategory: current.idCategory || "",
        startDate: current.startDate?.slice(0, 10) || "",
        endDate: current.endDate?.slice(0, 10) || "",
        status: current.status || "en-attente",
        members: current.members || [], // ✅ Fix 1: include members when editing
      });
    } else {
      setForm({
        name: "",
        description: "",
        idCategory: "",
        startDate: "",
        endDate: "",
        status: "en-attente",
        members: [], // ✅ Fix 1: reset members when creating
      });
    }
  }, [current]);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Erreur chargement catégories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Le nom du projet est requis";
    if (!form.description.trim()) errs.description = "La description est requise";
    if (!form.startDate) errs.startDate = "La date de début est requise";
    if (!form.endDate) errs.endDate = "La date de fin est requise";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      errs.endDate = "La date de fin doit être après la date de début";
    if (form.members.length === 0) errs.members = "Ajoutez au moins un membre";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }
    try {
      if (current) {
        const res = await API.put(`/projects/${current._id}`, form);
        if (!res.data.success) {
          toast.error(
            res.data.message || "Erreur lors de la mise à jour du projet",
          );
          return;
        }
      } else {
        await API.post("/projects", form);
      }
      onSaved();
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await API_AUTH.get("/users");
      setUsers(res.data);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
    }
  };

  // ✅ Fix 2: derive Select value from form.members so it stays in sync
  const selectedMembers = users
    .filter((u) => form.members.includes(u._id ?? u.id))
    .map((u) => ({ value: u._id ?? u.id, label: u.name }));

  return (
    <form onSubmit={handleSubmit} className="project-form">
      <div className="form-group">
        <label>Nom du projet</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nom du projet"
          className={errors.name ? "input-error" : ""}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Description du projet"
          rows={3}
          className={errors.description ? "input-error" : ""}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Catégorie</label>
          <select
            name="idCategory"
            value={form.idCategory}
            onChange={handleChange}
          >
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
            className={errors.startDate ? "input-error" : ""}
          />
          {errors.startDate && <span className="field-error">{errors.startDate}</span>}
        </div>
        <div className="form-group">
          <label>Date de fin</label>
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            className={errors.endDate ? "input-error" : ""}
          />
          {errors.endDate && <span className="field-error">{errors.endDate}</span>}
        </div>
      </div>
      <div className="form-group">
        <label>Membres</label>
        <MultiUserSelect
          users={users}
          value={form.members}
          onChange={(members) => { 
            setForm({ ...form, members });
            if (errors.members) setErrors({ ...errors, members: "" }); }}
        />
        {errors.members && <span className="field-error">{errors.members}</span>}
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          {current ? "Modifier" : "Créer le projet"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Annulé
        </button>
      </div>
    </form>
  );
}
