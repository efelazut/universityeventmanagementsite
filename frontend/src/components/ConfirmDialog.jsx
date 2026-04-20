import { useEffect } from "react";

export function ConfirmDialog({
  open,
  tone = "warning",
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  confirmDisabled = false,
  loading = false,
  onConfirm,
  onCancel,
  children
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-layer" role="presentation">
      <button className="dialog-backdrop" aria-label="Diyaloğu kapat" onClick={loading ? undefined : onCancel} />
      <div className={`confirm-dialog confirm-dialog-${tone}`} role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <div className="confirm-dialog-head">
          <span className={`confirm-dialog-icon ${tone}`}>{tone === "danger" ? "!" : "?"}</span>
          <div>
            <h3 id="confirm-dialog-title">{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
        </div>

        {children ? <div className="confirm-dialog-body">{children}</div> : null}

        <div className="confirm-dialog-actions">
          <button type="button" className="ghost-button" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={`primary-button ${tone === "danger" ? "destructive-button strong-destructive" : ""}`} onClick={onConfirm} disabled={confirmDisabled || loading}>
            {loading ? "İşleniyor..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
