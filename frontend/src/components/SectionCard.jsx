export function SectionCard({ title, description, eyebrow, action, children, className = "" }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <div className="section-header">
        <div className="section-title-block">
          {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {description ? <p className="section-description">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
