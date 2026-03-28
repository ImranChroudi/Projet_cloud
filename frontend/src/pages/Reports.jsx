import { useState, useEffect } from 'react';
import reportApi from '../api/reportApi';
import { BarChart3, Users, AlertCircle, TrendingUp, CheckCircle2, Clock, ListTodo, FolderKanban, Download } from 'lucide-react';

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#10b981',
};

const PRIORITY_LABELS = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Basse',
  High: 'Haute',
  Medium: 'Moyenne',
  Low: 'Basse',
};

const STATUS_COLORS = {
  todo: '#6b7280',
  'in-progress': '#3b82f6',
  done: '#10b981',
};

const STATUS_LABELS = {
  todo: 'À faire',
  'in-progress': 'En cours',
  done: 'Terminé',
};

export default function Reports() {
  const [tasksByPriority, setTasksByPriority] = useState([]);
  const [tasksByUser, setTasksByUser] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);
  const [userWorkload, setUserWorkload] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const [priorityRes, userRes, progressRes, workloadRes, overviewRes] = await Promise.allSettled([
        reportApi.get('/tasks-priority'),
        reportApi.get('/tasks-user'),
        reportApi.get('/project-progress'),
        reportApi.get('/user-workload'),
        reportApi.get('/overview'),
      ]);

      if (priorityRes.status === 'fulfilled') setTasksByPriority(priorityRes.value.data);
      if (userRes.status === 'fulfilled') setTasksByUser(userRes.value.data);
      if (progressRes.status === 'fulfilled') setProjectProgress(progressRes.value.data);
      if (workloadRes.status === 'fulfilled') setUserWorkload(workloadRes.value.data);
      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value.data);

      const allRejected = [priorityRes, userRes, progressRes, workloadRes, overviewRes].every(r => r.status === 'rejected');
      if (allRejected) setError('Impossible de charger les rapports');
    } catch {
      setError('Erreur de connexion au service de reporting');
    } finally {
      setLoading(false);
    }
  };

  const maxPriorityCount = Math.max(...tasksByPriority.map((s) => s.count), 1);
  const maxUserCount = Math.max(...tasksByUser.map((s) => s.count), 1);
  const totalTasks = tasksByPriority.reduce((sum, s) => sum + s.count, 0);

  const downloadCSV = () => {
    let csv = 'Rapport de Projet - Statistiques\n\n';

    // Overview
    if (overview) {
      csv += 'Vue d\'ensemble\n';
      csv += 'Métrique,Valeur\n';
      csv += `Total tâches,${overview.totalTasks}\n`;
      csv += `Projets,${overview.totalProjects}\n`;
      csv += `En cours,${overview.inProgress}\n`;
      csv += `Terminées,${overview.done}\n\n`;
    }

    // Project progress
    if (projectProgress.length > 0) {
      csv += 'Avancement des projets\n';
      csv += 'Projet,Total,Terminées,Progression\n';
      projectProgress.forEach((p) => {
        csv += `${p.projectName},${p.total},${p.doneCount},${p.percentage}%\n`;
      });
      csv += '\n';
    }

    // Tasks by priority
    if (tasksByPriority.length > 0) {
      csv += 'Tâches par priorité\n';
      csv += 'Priorité,Nombre\n';
      tasksByPriority.forEach((t) => {
        csv += `${PRIORITY_LABELS[t._id] || t._id || 'Non défini'},${t.count}\n`;
      });
      csv += '\n';
    }

    // User workload
    if (userWorkload.length > 0) {
      csv += 'Charge de travail par utilisateur\n';
      csv += 'Utilisateur,À faire,En cours,Terminé,Total,Progression\n';
      userWorkload.forEach((w) => {
        const pct = w.total > 0 ? Math.round((w.done / w.total) * 100) : 0;
        csv += `${w.user},${w.todo},${w.inProgress},${w.done},${w.total},${pct}%\n`;
      });
    }

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-projet-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="reports-page">
        <div className="reports-loading">
          <div className="spinner" style={{ width: 40, height: 40 }}></div>
          <p>Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1><BarChart3 size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />Rapports & Statistiques</h1>
          <p>Vue d'ensemble de l'avancement des projets et de la charge de travail</p>
        </div>
        <button className="btn-download-report" onClick={downloadCSV}>
          <Download size={18} /> Télécharger le rapport
        </button>
      </div>

      {error && (
        <div className="report-error">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Overview Stats Cards */}
      {overview && (
        <div className="report-overview">
          <div className="overview-card">
            <div className="overview-icon" style={{ background: 'var(--primary-bg, #EEF0FF)', color: 'var(--primary, #6C63FF)' }}>
              <ListTodo size={22} />
            </div>
            <div className="overview-info">
              <span className="overview-value">{overview.totalTasks}</span>
              <span className="overview-label">Total tâches</span>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon" style={{ background: '#DBEAFE', color: '#3B82F6' }}>
              <FolderKanban size={22} />
            </div>
            <div className="overview-info">
              <span className="overview-value">{overview.totalProjects}</span>
              <span className="overview-label">Projets</span>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>
              <Clock size={22} />
            </div>
            <div className="overview-info">
              <span className="overview-value">{overview.inProgress}</span>
              <span className="overview-label">En cours</span>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon" style={{ background: '#D1FAE5', color: '#10B981' }}>
              <CheckCircle2 size={22} />
            </div>
            <div className="overview-info">
              <span className="overview-value">{overview.done}</span>
              <span className="overview-label">Terminées</span>
            </div>
          </div>
        </div>
      )}

      <div className="reports-grid">
        {/* Project Progress */}
        <div className="report-card report-card-full">
          <div className="report-card-header">
            <h3><TrendingUp size={18} /> Avancement des projets</h3>
            <span className="report-total">{projectProgress.length} projets</span>
          </div>
          <div className="report-card-body">
            {projectProgress.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} />
                <p>Aucun projet trouvé</p>
              </div>
            ) : (
              <div className="project-progress-list">
                {projectProgress.map((project) => (
                  <div key={project.projectId} className="project-progress-item">
                    <div className="project-progress-header">
                      <span className="project-progress-name">{project.projectName}</span>
                      <span className="project-progress-pct">{project.percentage}%</span>
                    </div>
                    <div className="project-progress-bar-track">
                      {project.statuses.map((s) => (
                        <div
                          key={s.status}
                          className="project-progress-bar-segment"
                          style={{
                            width: `${(s.count / project.total) * 100}%`,
                            background: STATUS_COLORS[s.status] || '#cbd5e1',
                          }}
                          title={`${STATUS_LABELS[s.status] || s.status}: ${s.count}`}
                        />
                      ))}
                    </div>
                    <div className="project-progress-legend">
                      {project.statuses.map((s) => (
                        <span key={s.status} className="legend-item">
                          <span className="legend-dot" style={{ background: STATUS_COLORS[s.status] || '#cbd5e1' }} />
                          {STATUS_LABELS[s.status] || s.status}: {s.count}
                        </span>
                      ))}
                      <span className="legend-item legend-total">Total: {project.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="report-card">
          <div className="report-card-header">
            <h3><BarChart3 size={18} /> Tâches par priorité</h3>
            <span className="report-total">{totalTasks} tâches</span>
          </div>
          <div className="report-card-body">
            {tasksByPriority.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} />
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="report-bars">
                {tasksByPriority.map((item) => (
                  <div key={item._id} className="report-bar-row">
                    <div className="report-bar-label">
                      <span
                        className="report-priority-dot"
                        style={{ background: PRIORITY_COLORS[item._id] || '#6b7280' }}
                      />
                      {PRIORITY_LABELS[item._id] || item._id || 'Non défini'}
                    </div>
                    <div className="report-bar-track">
                      <div
                        className="report-bar-fill"
                        style={{
                          width: `${(item.count / maxPriorityCount) * 100}%`,
                          background: PRIORITY_COLORS[item._id] || '#6b7280',
                        }}
                      />
                    </div>
                    <span className="report-bar-count">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks by User */}
        <div className="report-card">
          <div className="report-card-header">
            <h3><Users size={18} /> Tâches par utilisateur</h3>
          </div>
          <div className="report-card-body">
            {tasksByUser.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} />
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="report-bars">
                {tasksByUser.map((item) => (
                  <div key={item._id} className="report-bar-row">
                    <div className="report-bar-label">
                      <span className="report-user-avatar">
                        {(item.responsible || '?').charAt(0).toUpperCase()}
                      </span>
                      {item.responsible || 'Non assigné'}
                    </div>
                    <div className="report-bar-track">
                      <div
                        className="report-bar-fill"
                        style={{
                          width: `${(item.count / maxUserCount) * 100}%`,
                          background: '#6C63FF',
                        }}
                      />
                    </div>
                    <span className="report-bar-count">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Workload Breakdown */}
        <div className="report-card report-card-full">
          <div className="report-card-header">
            <h3><Users size={18} /> Charge de travail par utilisateur</h3>
          </div>
          <div className="report-card-body">
            {userWorkload.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={32} />
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="workload-table">
                <div className="workload-header">
                  <span>Utilisateur</span>
                  <span>À faire</span>
                  <span>En cours</span>
                  <span>Terminé</span>
                  <span>Total</span>
                  <span>Progression</span>
                </div>
                {userWorkload.map((w) => {
                  const pct = w.total > 0 ? Math.round((w.done / w.total) * 100) : 0;
                  console.log(w)
                  return (
                    <div key={w.user} className="workload-row">
                      <span className="workload-user">
                        <span className="report-user-avatar">{w.user.charAt(0).toUpperCase()}</span>
                        {w.user}
                      </span>
                      <span className="workload-stat">
                        <span className="workload-badge badge-todo">{w.todo}</span>
                      </span>
                      <span className="workload-stat">
                        <span className="workload-badge badge-progress">{w.inProgress}</span>
                      </span>
                      <span className="workload-stat">
                        <span className="workload-badge badge-done">{w.done}</span>
                      </span>
                      <span className="workload-stat workload-total">{w.total}</span>
                      <span className="workload-stat">
                        <div className="workload-progress-track">
                          <div className="workload-progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="workload-pct">{pct}%</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
