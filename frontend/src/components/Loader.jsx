// Simple Loader component for showing a spinner
export default function Loader({ text = 'Chargement...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <div>{text}</div>
    </div>
  );
}
