export function EmptyState({ title, description, action, icon = "○" }) {
  return (
    <div className="empty-state-box">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <div className="empty-state-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
