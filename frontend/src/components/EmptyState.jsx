function EmptyIcon({ name }) {
  const key = String(name || "info").toLowerCase();
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true
  };

  if (key.includes("event") || key.includes("et")) {
    return <svg {...common}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /></svg>;
  }

  if (key.includes("club") || key.includes("kl") || key.includes("team") || key.includes("uy") || key.includes("ü")) {
    return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-8 0v2" /><circle cx="12" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M2 21v-2a4 4 0 0 1 3-3.87" /></svg>;
  }

  if (key.includes("message") || key.includes("ms")) {
    return <svg {...common}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>;
  }

  if (key.includes("calendar") || key.includes("tk") || key.includes("kt")) {
    return <svg {...common}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 10h18" /></svg>;
  }

  if (key.includes("room") || key.includes("sl")) {
    return <svg {...common}><path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" /><path d="M9 21v-6h3v6" /><path d="M3 21h18" /></svg>;
  }

  if (key.includes("rating") || key.includes("pn")) {
    return <svg {...common}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01z" /></svg>;
  }

  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>;
}

export function EmptyState({ title, description, action, icon = "info" }) {
  return (
    <div className="empty-state-box">
      <span className="empty-state-icon"><EmptyIcon name={icon} /></span>
      <div className="empty-state-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
