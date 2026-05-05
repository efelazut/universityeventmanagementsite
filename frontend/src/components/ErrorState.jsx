import { EmptyState } from "./EmptyState";

export function ErrorState({
  title = "Veri yüklenemedi",
  description = "Sunucudan veri alınırken bir sorun oluştu.",
  error,
  onRetry,
  icon = "!"
}) {
  return (
    <div className="error-state-card">
      <EmptyState
        title={title}
        description={description}
        icon={icon}
        action={
          <div className="error-state-actions">
            {error ? <span className="error-state-message">{error}</span> : null}
            {onRetry ? (
              <button className="primary-button" type="button" onClick={onRetry}>
                Tekrar dene
              </button>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
