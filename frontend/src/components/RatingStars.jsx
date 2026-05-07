// Yıldız karakterleri: Unicode escape ile tanımlı, encoding sorunlarına karşı güvenli
const STAR_FILLED = "\u2605"; // ★
const STAR_EMPTY  = "\u2606"; // ☆

export function RatingStars({ value = 0, reviewCount, compact = false }) {
  const safeValue = Math.max(0, Math.min(5, Number(value) || 0));
  const filledCount = Math.round(safeValue);
  const hasReviews = typeof reviewCount === "number" && reviewCount > 0;

  return (
    <div className={`rating-stars ${compact ? "rating-stars-compact" : ""}`.trim()}>
      {(hasReviews || safeValue > 0) ? (
        <div className="rating-stars-track" aria-label={`${safeValue.toFixed(1)} üzerinden 5 yıldız`}>
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index < filledCount ? "is-filled" : "is-empty"} aria-hidden="true">
              {index < filledCount ? STAR_FILLED : STAR_EMPTY}
            </span>
          ))}
        </div>
      ) : null}
      <strong>{safeValue > 0 ? safeValue.toFixed(1) : "Yeni"}</strong>
      {typeof reviewCount === "number" ? (
        <small>{reviewCount > 0 ? reviewCount : "0"} değerlendirme</small>
      ) : null}
    </div>
  );
}

