export function SectionCard({ title, description, eyebrow, action, children, className = "" }) {
  return (
    <section className={`section-card section-card-premium ${className}`.trim()}>
      <div className="section-header">
        <div className="section-title-block">
          {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
          <div className="section-heading-row">
            <span className="section-title-mark" aria-hidden="true" />
            <h2>{title}</h2>
          </div>
          {description ? <p className="section-description">{description}</p> : null}
        </div>
        {action ? <div className="section-action">{action}</div> : null}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
