export function RatingStars({ value = 0, reviewCount, compact = false }) {
  const safeValue = Math.max(0, Math.min(5, Number(value) || 0));
  const filledCount = Math.round(safeValue);

  return (
    <div className={`rating-stars ${compact ? "rating-stars-compact" : ""}`.trim()}>
      <div className="rating-stars-track" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span key={index} className={index < filledCount ? "is-filled" : ""}>
            â˜…
          </span>
        ))}
      </div>
      <strong>{safeValue ? safeValue.toFixed(1) : "Yeni"}</strong>
      {typeof reviewCount === "number" ? <small>{reviewCount} değerlendirme</small> : null}
    </div>
  );
}
