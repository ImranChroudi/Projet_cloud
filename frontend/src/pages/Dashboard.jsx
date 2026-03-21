import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  FolderKanban,
  ListTodo,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    completed: 0,
    inProgress: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [projRes, taskRes] = await Promise.allSettled([
        API.get('/projects'),
        API.get('/tasks'),
      ]);

      const projects = projRes.status === 'fulfilled' ? projRes.value.data : [];
      const tasks = taskRes.status === 'fulfilled' ? taskRes.value.data : [];

      setStats({
        projects: projects.length,
        tasks: tasks.length,
        completed: tasks.filter((t) => t.status === 'done').length,
        inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      });

      setRecentProjects(projects.slice(0, 5));
      setRecentTasks(tasks.slice(0, 5));
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  };

  const statusConfig = {
    'en-cours': { label: 'En cours', className: 'status-en-cours' },
    'termine': { label: 'Terminé', className: 'status-termine' },
    'en-attente': { label: 'En attente', className: 'status-en-attente' },
    'annule': { label: 'Annulé', className: 'status-annule' },
  };

  const priorityConfig = {
    high: { label: 'Haute', className: 'priority-high' },
    medium: { label: 'Moyenne', className: 'priority-medium' },
    low: { label: 'Basse', className: 'priority-low' },
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Bonjour, {user?.username} 👋</h1>
          <p>Voici un aperçu de votre espace de travail</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-purple">
          <div className="stat-icon">
            <FolderKanban size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.projects}</span>
            <span className="stat-label">Projets</span>
          </div>
        </div>

        <div className="stat-card stat-blue">
          <div className="stat-icon">
            <ListTodo size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.tasks}</span>
            <span className="stat-label">Tâches</span>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Terminées</span>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">En cours</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>
              <FolderKanban size={18} /> Projets récents
            </h3>
            <Link to="/projects" className="dash-card-link">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="dash-card-body">
            {recentProjects.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} />
                <p>Aucun projet pour le moment</p>
              </div>
            ) : (
              <ul className="dash-list">
                {recentProjects.map((p) => (
                  <li key={p._id} className="dash-list-item">
                    <div className="dash-list-info">
                      <span className="dash-list-title">{p.name}</span>
                      <span className="dash-list-sub">
                        {p.description?.substring(0, 60) || 'Pas de description'}
                      </span>
                    </div>
                    <span
                      className={`status-badge ${statusConfig[p.status]?.className || ''}`}
                    >
                      {statusConfig[p.status]?.label || p.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3>
              <Clock size={18} /> Tâches récentes
            </h3>
            <Link to="/tasks" className="dash-card-link">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          <div className="dash-card-body">
            {recentTasks.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} />
                <p>Aucune tâche pour le moment</p>
              </div>
            ) : (
              <ul className="dash-list">
                {recentTasks.map((t) => (
                  <li key={t._id} className="dash-list-item">
                    <div className="dash-list-info">
                      <span className="dash-list-title">{t.title}</span>
                      <span className="dash-list-sub">
                        {t.deadline
                          ? `Deadline: ${new Date(t.deadline).toLocaleDateString('fr-FR')}`
                          : 'Pas de deadline'}
                      </span>
                    </div>
                    <span
                      className={`priority-badge ${priorityConfig[t.priority]?.className || ''}`}
                    >
                      {priorityConfig[t.priority]?.label || t.priority}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
