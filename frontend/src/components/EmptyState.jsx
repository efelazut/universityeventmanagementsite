export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state-box">
      <strong>{title}</strong>
      <span>{description}</span>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
