import { AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, type = 'danger' }) {
  if (!open) return null;

  const icon = type === 'danger' ? <AlertTriangle size={24} /> : <Info size={24} />;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel}><X size={18} /></button>
        <div className={`modal-icon modal-icon-${type}`}>{icon}</div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
          <button className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
