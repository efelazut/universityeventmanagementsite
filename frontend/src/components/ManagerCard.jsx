function getInitials(name) {
  return String(name || "?")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ManagerCard({ manager, canRemove, onRemove }) {
  const roleLabel = manager.role === "President" ? "Başkan" : "Yönetici";

  return (
    <article className="manager-card">
      <div className="manager-avatar">
        {manager.avatarUrl ? <img src={manager.avatarUrl} alt="" /> : <span>{getInitials(manager.userFullName)}</span>}
      </div>
      <div className="manager-card-copy">
        <strong>{manager.userFullName}</strong>
        <span>{manager.userEmail}</span>
      </div>
      <span className={`pill ${manager.role === "President" ? "tone-gold" : "tone-blue"}`}>{roleLabel}</span>
      {canRemove ? (
        <button className="mini-button destructive-button" type="button" onClick={() => onRemove(manager)}>
          Sil
        </button>
      ) : null}
    </article>
  );
}
