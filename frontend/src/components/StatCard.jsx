export function StatCard({ title, value, accent, subtitle, meta }) {
  return (
    <div className={`stat-card ${accent || ""}`}>
      <span className="stat-card-title">{title}</span>
      <strong>{value}</strong>
      {subtitle || meta ? (
        <div className="stat-card-copy">
          {subtitle ? <small>{subtitle}</small> : null}
          {meta ? <em>{meta}</em> : null}
        </div>
      ) : null}
    </div>
  );
}
