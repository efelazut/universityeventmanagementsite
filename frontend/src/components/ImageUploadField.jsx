export function ImageUploadField({
  label,
  hint,
  previewUrl,
  inputId,
  onFileChange,
  onClear,
  error,
  accept = "image/png,image/jpeg,image/webp"
}) {
  return (
    <div className="image-upload-field">
      <div className="image-upload-head">
        <strong>{label}</strong>
        {hint ? <span>{hint}</span> : null}
      </div>

      <label className="image-upload-dropzone" htmlFor={inputId}>
        {previewUrl ? (
          <img className="image-upload-preview" src={previewUrl} alt={label} />
        ) : (
          <div className="image-upload-placeholder">
            <strong>Dosya Seç</strong>
            <span>PNG, JPG veya WEBP • en fazla 5 MB</span>
          </div>
        )}
      </label>

      <input id={inputId} className="image-upload-input" type="file" accept={accept} onChange={onFileChange} />

      <div className="image-upload-actions">
        <label className="ghost-button link-button" htmlFor={inputId}>
          Görsel Seç
        </label>
        {previewUrl ? (
          <button type="button" className="ghost-button" onClick={onClear}>
            Kaldır
          </button>
        ) : null}
      </div>

      {error ? <div className="error-text">{error}</div> : null}
    </div>
  );
}
