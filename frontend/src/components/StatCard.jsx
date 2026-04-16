export function StatCard({ title, value, accent, subtitle, meta }) {
  return (
    <div className={`stat-card ${accent || ""}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      {subtitle ? <small>{subtitle}</small> : null}
      {meta ? <em>{meta}</em> : null}
    </div>
  );
}
